import "server-only";
import { cookies } from "next/headers";
import { coerceLocale, getDictionary, LOCALE_COOKIE, type Dictionary, type Locale } from ".";
import { applyOverrides } from "./overrides";
import { getOverrides } from "./textStore";

/** Read the active locale from the request cookie. Server components only. */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  return coerceLocale(store.get(LOCALE_COOKIE)?.value);
}

/**
 * Convenience: active locale + its dictionary, for server components.
 *
 * The dictionary has any admin-edited copy applied on top. Every server
 * component already goes through here, so editing a string in the panel reaches
 * all of them without touching a single call site.
 */
export async function getServerDictionary(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getServerLocale();
  const overrides = await getOverrides(locale);
  return { locale, t: applyOverrides(getDictionary(locale), overrides) };
}
