import type { User } from "@prisma/client";

import { hashPassword, needsRehash, verifyPassword } from "../lib/password.js";
import { logger } from "../lib/logger.js";
import { AppError } from "../middleware/error-handler.js";
import { emailVerificationRepository } from "../repositories/email-verification-repository.js";
import { passwordResetRepository } from "../repositories/password-reset-repository.js";
import { userRepository } from "../repositories/user-repository.js";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateAuthProfileInput,
  VerifyEmailInput,
} from "../schemas/auth.js";
import { ErrorCode, HttpStatus } from "../types/api.js";
import type { AuthProvider, AuthResponse, RegisterResponse, UserPublic } from "../types/auth.js";
import { emailService } from "./email-service.js";

function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider as AuthProvider,
    emailVerified: user.emailVerified,
    socialUrl: user.socialUrl,
    locale: user.locale ?? "hy",
    createdAt: user.createdAt.toISOString(),
  };
}

export const authService = {
  toPublicUser,

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return { message: "Եթե այս էլ․ փոստով հաշիվ կա, հաստատման նամակ ուղարկվել է։" };
    }
    if (user.emailVerified) {
      return { message: "Էլ․ փոստն արդեն հաստատված է։" };
    }
    const verificationToken = await emailVerificationRepository.create(user.id);
    await emailService.sendVerifyEmail(user.email, user.name, verificationToken.token);
    return { message: "Հաստատման նամակն ուղարկված է։ Ստուգեք Ձեր փոստարկղը։" };
  },

  async register(input: RegisterInput): Promise<RegisterResponse> {
    const exists = await userRepository.existsByEmail(input.email);
    if (exists) {
      throw new AppError(HttpStatus.CONFLICT, ErrorCode.EMAIL_ALREADY_EXISTS, "Այս էլ․ փոստով հաշիվ արդեն գոյություն ունի");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
      provider: "local",
      locale: "hy",
    });

    const verificationToken = await emailVerificationRepository.create(user.id);
    emailService.sendVerifyEmail(user.email, user.name, verificationToken.token).catch((error) => {
      logger.error({ error, userId: user.id }, "Failed to send verification email");
    });

    return { message: "Գրանցումն հաջողվեց։ Խնդրում ենք ստուգել էլ․ փոստը՝ հաշիվը հաստատելու համար։" };
  },

  async login(input: LoginInput): Promise<Omit<AuthResponse, "accessToken" | "refreshToken">> {
    const user = await userRepository.findByEmail(input.email);

    if (!user || !user.passwordHash) {
      throw new AppError(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS, "Սխալ էլ․ փոստ կամ գաղտնաբառ");
    }

    if (user.provider === "local" && !user.emailVerified) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        ErrorCode.EMAIL_NOT_VERIFIED,
        "Մուտք գործելուց առաջ հաստատեք Ձեր էլ․ փոստը։",
      );
    }

    const isValid = await verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new AppError(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS, "Սխալ էլ․ փոստ կամ գաղտնաբառ");
    }

    if (needsRehash(user.passwordHash)) {
      const newHash = await hashPassword(input.password);
      await userRepository.update(user.id, { passwordHash: newHash });
    }

    return { user: toPublicUser(user), message: "Մուտքն հաջողվեց" };
  },

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<UserPublic> {
    let user = await userRepository.findByGoogleId(profile.googleId);
    if (user) return toPublicUser(user);

    user = await userRepository.findByEmail(profile.email);
    if (user) {
      const updated = await userRepository.update(user.id, {
        googleId: profile.googleId,
        avatarUrl: user.avatarUrl ?? profile.avatarUrl,
        emailVerified: true,
      });
      return toPublicUser(updated!);
    }

    user = await userRepository.create({
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      provider: "google",
      googleId: profile.googleId,
      emailVerified: true,
      locale: "hy",
    });

    return toPublicUser(user);
  },

  async getUserById(id: string): Promise<UserPublic | null> {
    const user = await userRepository.findById(id);
    return user ? toPublicUser(user) : null;
  },

  async updateProfile(userId: string, input: UpdateAuthProfileInput): Promise<UserPublic> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, "Օգտատերը չի գտնվել");
    }

    const updated = await userRepository.update(userId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.socialUrl !== undefined && { socialUrl: input.socialUrl }),
    });

    if (!updated) {
      throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, "Չհաջողվեց թարմացնել պրոֆիլը");
    }

    return toPublicUser(updated);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<{ message: string }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, "Օգտատերը չի գտնվել");
    }
    if (user.provider !== "local" || !user.passwordHash) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
        "Գաղտնաբառի փոփոխությունը հասանելի է միայն էլ․ փոստով գրանցված հաշիվների համար",
      );
    }

    const valid = await verifyPassword(user.passwordHash, input.currentPassword);
    if (!valid) {
      throw new AppError(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS, "Ընթացիկ գաղտնաբառը սխալ է");
    }

    const passwordHash = await hashPassword(input.newPassword);
    await userRepository.update(userId, { passwordHash });
    emailService.sendPasswordChanged(user.email, user.name).catch((error) => {
      logger.error({ error, userId }, "Failed to send password changed email");
    });

    return { message: "Գաղտնաբառը հաջողությամբ թարմացվել է" };
  },

  async deleteAccount(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, "Օգտատերը չի գտնվել");
    }

    const deleted = await userRepository.delete(userId);
    if (!deleted) {
      throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, "Չհաջողվեց ջնջել հաշիվը");
    }

    emailService.sendAccountDeleted(user.email, user.name).catch((error) => {
      logger.error({ error, userId }, "Failed to send account deletion email");
    });
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(input.email);
    const successMessage = "Եթե այս էլ․ փոստով հաշիվ կա, կստանաք գաղտնաբառի վերականգնման հղում";

    if (!user) {
      return { message: successMessage };
    }

    if (user.provider !== "local" && !user.passwordHash) {
      try {
        await emailService.sendPasswordResetOAuthNotice(user.email, user.name);
      } catch (error) {
        logger.error({ error, userId: user.id }, "Failed to send OAuth sign-in notice email");
      }
      return { message: successMessage };
    }

    const resetToken = await passwordResetRepository.create(user.id);
    try {
      await emailService.sendPasswordReset(user.email, user.name, resetToken.token);
    } catch (error) {
      logger.error({ error, userId: user.id }, "Failed to send password reset email");
    }

    return { message: successMessage };
  },

  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const tokenRecord = await passwordResetRepository.findValidToken(input.token);
    if (!tokenRecord) {
      throw new AppError(HttpStatus.BAD_REQUEST, ErrorCode.INVALID_TOKEN, "Անվավեր կամ ժամկետանց վերականգնման հղում");
    }

    const passwordHash = await hashPassword(input.password);
    await userRepository.update(tokenRecord.userId, { passwordHash });
    await passwordResetRepository.markAsUsed(tokenRecord.id);

    emailService.sendPasswordChanged(tokenRecord.user.email, tokenRecord.user.name).catch((error) => {
      logger.error({ error, userId: tokenRecord.userId }, "Failed to send password changed email");
    });

    return { message: "Գաղտնաբառը հաջողությամբ վերականգնվել է" };
  },

  async verifyEmail(input: VerifyEmailInput): Promise<{ message: string }> {
    const tokenRecord = await emailVerificationRepository.findValidToken(input.token);

    if (tokenRecord) {
      await userRepository.update(tokenRecord.userId, { emailVerified: true });
      await emailVerificationRepository.markAsUsed(tokenRecord.id);
      emailService.sendWelcome(tokenRecord.user.email, tokenRecord.user.name).catch((error) => {
        logger.error({ error, userId: tokenRecord.userId }, "Failed to send welcome email");
      });
      return { message: "Էլ․ փոստը հաստատված է։ Այժմ կարող եք մուտք գործել։" };
    }

    const usedRecord = await emailVerificationRepository.findByTokenWithUser(input.token);
    if (usedRecord?.user.emailVerified) {
      return { message: "Էլ․ փոստն արդեն հաստատված է։ Կարող եք մուտք գործել։" };
    }

    throw new AppError(HttpStatus.BAD_REQUEST, ErrorCode.INVALID_TOKEN, "Անվավեր կամ ժամկետանց հաստատման հղում։");
  },
};
