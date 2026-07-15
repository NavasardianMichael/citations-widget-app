export type AuthProvider = "local" | "google";

export type UserPublic = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  provider: AuthProvider;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  socialUrl: string | null;
  locale: string;
  createdAt: string;
};

export type AuthResponse = {
  user: UserPublic;
  message: string;
  accessToken: string;
  refreshToken: string;
};

export type RegisterResponse = {
  message: string;
};
