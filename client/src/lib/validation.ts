import { t, type MessageKey } from "@/i18n";

const EMAIL_MAX = 255;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const NAME_MIN = 2;
const NAME_MAX = 100;
const CITATION_TEXT_MAX = 2000;
const CITATION_META_MAX = 200;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Letters (incl. Armenian), spaces, hyphens, apostrophes */
const NAME_RE = /^[\p{L}\s'-]+$/u;

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

function required(value: string, key: MessageKey): string | null {
  return value.trim() ? null : t(key);
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  const missing = required(trimmed, "validation.emailRequired");
  if (missing) return missing;
  if (trimmed.length > EMAIL_MAX || !EMAIL_RE.test(trimmed)) {
    return t("validation.emailInvalid");
  }
  return null;
}

/** Login: required only (server accepts any non-empty password). */
export function validateLoginPassword(value: string): string | null {
  return required(value, "validation.passwordRequired");
}

/** Register / reset: strength rules matching server AUTH_VALIDATION. */
export function validatePassword(value: string): string | null {
  const missing = required(value, "validation.passwordRequired");
  if (missing) return missing;
  if (value.length < PASSWORD_MIN) return t("validation.passwordMin");
  if (value.length > PASSWORD_MAX) return t("validation.passwordMax");
  if (!/[a-z]/.test(value)) return t("validation.passwordLower");
  if (!/[A-Z]/.test(value)) return t("validation.passwordUpper");
  if (!/[0-9]/.test(value)) return t("validation.passwordNumber");
  return null;
}

export function validateName(value: string): string | null {
  const trimmed = value.trim();
  const missing = required(trimmed, "validation.nameRequired");
  if (missing) return missing;
  if (trimmed.length < NAME_MIN) return t("validation.nameMin");
  if (trimmed.length > NAME_MAX) return t("validation.nameMax");
  if (!NAME_RE.test(trimmed)) return t("validation.namePattern");
  return null;
}

export function validateCitationText(value: string): string | null {
  const trimmed = value.trim();
  const missing = required(trimmed, "validation.citationTextRequired");
  if (missing) return missing;
  if (trimmed.length > CITATION_TEXT_MAX) return t("validation.citationTextMax");
  return null;
}

export function validateCitationMeta(value: string, field: "author" | "source"): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > CITATION_META_MAX) {
    return field === "author" ? t("validation.authorMax") : t("validation.sourceMax");
  }
  return null;
}

export function validateLogin(fields: { email: string; password: string }): FieldErrors<"email" | "password"> {
  const errors: FieldErrors<"email" | "password"> = {};
  const email = validateEmail(fields.email);
  const password = validateLoginPassword(fields.password);
  if (email) errors.email = email;
  if (password) errors.password = password;
  return errors;
}

export function validateRegister(fields: {
  name: string;
  email: string;
  password: string;
}): FieldErrors<"name" | "email" | "password"> {
  const errors: FieldErrors<"name" | "email" | "password"> = {};
  const name = validateName(fields.name);
  const email = validateEmail(fields.email);
  const password = validatePassword(fields.password);
  if (name) errors.name = name;
  if (email) errors.email = email;
  if (password) errors.password = password;
  return errors;
}

export function validateForgotPassword(fields: { email: string }): FieldErrors<"email"> {
  const errors: FieldErrors<"email"> = {};
  const email = validateEmail(fields.email);
  if (email) errors.email = email;
  return errors;
}

export function validateResetPassword(fields: { password: string }): FieldErrors<"password"> {
  const errors: FieldErrors<"password"> = {};
  const password = validatePassword(fields.password);
  if (password) errors.password = password;
  return errors;
}

export function validateCitationForm(fields: {
  text: string;
  author: string;
  source: string;
}): FieldErrors<"text" | "author" | "source"> {
  const errors: FieldErrors<"text" | "author" | "source"> = {};
  const text = validateCitationText(fields.text);
  const author = validateCitationMeta(fields.author, "author");
  const source = validateCitationMeta(fields.source, "source");
  if (text) errors.text = text;
  if (author) errors.author = author;
  if (source) errors.source = source;
  return errors;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
