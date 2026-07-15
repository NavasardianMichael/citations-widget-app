import type { HyMessages } from "./locales/hy";

export const SUPPORTED_LOCALES = ["hy"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "hy";

export type MessageKey = keyof HyMessages;
