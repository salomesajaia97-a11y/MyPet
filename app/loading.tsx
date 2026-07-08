"use client";
import { useT } from "@/components/i18n/LanguageProvider";

export default function Loading() {
  const { t } = useT();
  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#EBF6FA] flex items-center justify-center">
      <div
        className="h-10 w-10 rounded-full border-4 border-[#0E4A5C]/20 border-t-[#0E4A5C] animate-spin"
        role="status"
        aria-label={t.misc.loading}
      />
    </div>
  );
}
