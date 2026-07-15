import { hy } from "./locales/hy";
import { DEFAULT_LOCALE, type AppLocale, type MessageKey } from "./types";

const catalogs: Record<AppLocale, Record<string, string>> = {
  hy,
};

let activeLocale: AppLocale = DEFAULT_LOCALE;

export function setLocale(locale: AppLocale) {
  activeLocale = locale;
}

export function getLocale(): AppLocale {
  return activeLocale;
}

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const catalog = catalogs[activeLocale] ?? catalogs[DEFAULT_LOCALE];
  let value = catalog[key] ?? catalogs[DEFAULT_LOCALE][key] ?? String(key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return value;
}
