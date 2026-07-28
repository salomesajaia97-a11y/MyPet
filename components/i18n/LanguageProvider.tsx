"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDictionary,
  LOCALE_COOKIE,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";
import { applyOverrides, type TextOverrides } from "@/lib/i18n/overrides";

type LanguageContextValue = {
  locale: Locale;
  t: Dictionary;
  setLocale: (next: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

export function LanguageProvider({
  initialLocale,
  overrides,
  children,
}: {
  initialLocale: Locale;
  /**
   * Admin-edited copy for BOTH locales, handed down from the root layout.
   * Switching language re-renders client components immediately from the
   * dictionary they already hold, so the overrides for the language being
   * switched *to* have to be here too — fetching them on switch would show the
   * original wording for a beat before correcting itself.
   */
  overrides?: Partial<Record<Locale, TextOverrides>>;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      // Persist the choice; server components read this cookie on refresh.
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${ONE_YEAR};samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      // Re-render server components with the new cookie without a full reload.
      router.refresh();
    },
    [locale, router]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      t: applyOverrides(getDictionary(locale), overrides?.[locale] ?? {}),
      setLocale,
    }),
    [locale, overrides, setLocale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Access the active locale, its dictionary (`t`), and `setLocale`. Client only. */
export function useT(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be used within <LanguageProvider>");
  return ctx;
}
