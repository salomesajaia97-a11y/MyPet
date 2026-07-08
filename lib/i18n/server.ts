import "server-only";
import { cookies } from "next/headers";
import { coerceLocale, getDictionary, LOCALE_COOKIE, type Dictionary, type Locale } from ".";

/** Read the active locale from the request cookie. Server components only. */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  return coerceLocale(store.get(LOCALE_COOKIE)?.value);
}

/** Convenience: active locale + its dictionary, for server components. */
export async function getServerDictionary(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getServerLocale();
  return { locale, t: getDictionary(locale) };
}
