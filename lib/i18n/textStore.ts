import "server-only";
import { connectDB } from "@/lib/db";
import SiteTextModel from "@/lib/models/SiteText";
import { locales, type Locale } from ".";
import type { TextOverrides } from "./overrides";

/**
 * Copy overrides, read once per short window.
 *
 * Same shape of cache as the settings module, for the same reason: this is on
 * the render path of every page, so it cannot be a query per request, and it is
 * cleared on save so an edit shows up immediately for the person who made it.
 * At most TTL_MS of staleness elsewhere is an acceptable trade for not needing
 * cross-instance invalidation.
 */
const TTL_MS = 30_000;
let cache: { at: number; value: Record<Locale, TextOverrides> } | null = null;

const empty = (): Record<Locale, TextOverrides> =>
  Object.fromEntries(locales.map((l) => [l, {}])) as Record<Locale, TextOverrides>;

export function clearTextCache(): void {
  cache = null;
}

/** Overrides for every locale — the client needs both, since switching language
 *  re-renders from the dictionary it already has. */
export async function getAllOverrides(): Promise<Record<Locale, TextOverrides>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  try {
    await connectDB();
    const rows = await SiteTextModel.find({})
      .select("locale key value")
      .lean<{ locale: Locale; key: string; value: string }[]>();
    const value = empty();
    for (const row of rows) {
      if (value[row.locale]) value[row.locale][row.key] = row.value;
    }
    cache = { at: Date.now(), value };
    return value;
  } catch (err) {
    // Copy must never be the reason a page fails: fall back to the compiled
    // dictionaries by returning no overrides at all.
    console.error("[i18n] override read failed", err instanceof Error ? err.message : err);
    return empty();
  }
}

export async function getOverrides(locale: Locale): Promise<TextOverrides> {
  return (await getAllOverrides())[locale] ?? {};
}
