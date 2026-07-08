"use client";
import { SessionProvider } from "next-auth/react";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n";

export function Providers({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <LanguageProvider initialLocale={initialLocale}>
        <FavoritesProvider>{children}</FavoritesProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
