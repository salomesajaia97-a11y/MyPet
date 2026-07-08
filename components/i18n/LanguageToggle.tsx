"use client";
import { useT } from "./LanguageProvider";
import { cn } from "@/lib/utils/cn";
import { locales, type Locale } from "@/lib/i18n";

const LABEL: Record<Locale, string> = { ka: "KA", en: "EN" };

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useT();

  return (
    <div
      role="group"
      aria-label="Language / ენა"
      className={cn(
        "flex items-center rounded-full border border-stone-200 bg-stone-50 p-0.5 text-xs font-bold",
        className
      )}
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            "rounded-full px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4A5C]/40",
            locale === l
              ? "bg-[#0E4A5C] text-white"
              : "text-stone-500 hover:text-[#0E4A5C]"
          )}
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}
