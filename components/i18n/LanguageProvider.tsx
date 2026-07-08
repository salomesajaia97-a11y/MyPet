"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDictionary,
  LOCALE_COOKIE,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  t: Dictionary;
  setLocale: (next: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
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
    () => ({ locale, t: getDictionary(locale), setLocale }),
    [locale, setLocale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Access the active locale, its dictionary (`t`), and `setLocale`. Client only. */
export function useT(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be used within <LanguageProvider>");
  return ctx;
}
