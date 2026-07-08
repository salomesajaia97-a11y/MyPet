import { ka } from "./dictionaries/ka";
import { en } from "./dictionaries/en";

export const locales = ["ka", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ka";

export const LOCALE_COOKIE = "locale";

/** Dictionary shape is defined by the Georgian dictionary; `en` must mirror it. */
export type Dictionary = typeof ka;

const dictionaries: Record<Locale, Dictionary> = { ka, en };

export function coerceLocale(value: string | undefined | null): Locale {
  return value === "en" || value === "ka" ? value : defaultLocale;
}

/** Pick a dictionary by locale. Safe on both server and client. */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
