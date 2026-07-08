"use client";

import { useEffect } from "react";
import { useT } from "@/components/i18n/LanguageProvider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#EBF6FA] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">😿</div>
        <h1 className="text-3xl font-black text-[#0F2830] mb-2">{t.misc.errorTitle}</h1>
        <p className="text-stone-500 mb-6">
          {t.misc.errorBody}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-[#0E4A5C] text-white rounded-full px-6 py-3 text-sm font-semibold hover:bg-[#0B3D4E] transition-colors"
        >
          {t.misc.errorRetry}
        </button>
      </div>
    </div>
  );
}
