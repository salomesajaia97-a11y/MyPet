"use client";
import { SessionProvider } from "next-auth/react";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import type { Locale } from "@/lib/i18n";
import type { TextOverrides } from "@/lib/i18n/overrides";

export function Providers({
  initialLocale,
  overrides,
  children,
}: {
  initialLocale: Locale;
  /** Admin-edited copy for both locales, read server-side in the root layout. */
  overrides?: Partial<Record<Locale, TextOverrides>>;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <LanguageProvider initialLocale={initialLocale} overrides={overrides}>
        <ConfirmProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </ConfirmProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
