import { z } from "zod";

import { AUTH_VALIDATION } from "../constants/validation.js";

const { email, password, name, token } = AUTH_VALIDATION;

const passwordSchema = z
  .string()
  .min(password.minLength, password.messages.minLength)
  .max(password.maxLength, password.messages.maxLength)
  .regex(password.patterns.lowercase, password.messages.lowercase)
  .regex(password.patterns.uppercase, password.messages.uppercase)
  .regex(password.patterns.number, password.messages.number);

export const loginSchema = z.object({
  email: z.string().email(email.messages.invalid).max(email.maxLength),
  password: z.string().min(1, password.messages.required).max(password.maxLength),
  forceLogin: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: z.string().email(email.messages.invalid).max(email.maxLength),
  password: passwordSchema,
  name: z
    .string()
    .min(name.minLength, name.messages.minLength)
    .max(name.maxLength, name.messages.maxLength)
    .regex(name.pattern, name.messages.pattern),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(email.messages.invalid).max(email.maxLength),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, token.messages.required),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, password.messages.required),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, token.messages.required),
});

export const updateAuthProfileSchema = z
  .object({
    name: z
      .string()
      .min(name.minLength, name.messages.minLength)
      .max(name.maxLength, name.messages.maxLength)
      .regex(name.pattern, name.messages.pattern)
      .optional(),
    firstName: z.string().min(1).max(100).nullable().optional(),
    lastName: z.string().min(1).max(100).nullable().optional(),
    socialUrl: z.string().url().max(300).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const googleMobileSchema = z.object({
  idToken: z.string().min(1),
  forceLogin: z.boolean().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type UpdateAuthProfileInput = z.infer<typeof updateAuthProfileSchema>;
export type GoogleMobileInput = z.infer<typeof googleMobileSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
