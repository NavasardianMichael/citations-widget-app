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

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
};
