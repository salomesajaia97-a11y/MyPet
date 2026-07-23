"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Sparkles, Upload, ArrowLeft, Loader2 } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

interface Match {
  id: string;
  confidence: "high" | "medium" | "low";
  reason: string;
  breed: string;
  status: string;
  location: string;
  image: string;
}

const CONF_CLASS: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-stone-100 text-stone-600",
};

export default function LostPetMatchPage() {
  const { t } = useT();
  const { status } = useSession();
  const [preview, setPreview] = useState<string | null>(null);
  const [payload, setPayload] = useState<{ image: string; mediaType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t.marketplace.errOnlyImage);
      return;
    }
    setError("");
    setMatches(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setPayload({ image: dataUrl.split(",")[1] ?? "", mediaType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const run = async () => {
    if (!payload) return;
    setLoading(true);
    setError("");
    setMatches(null);
    try {
      const res = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setError(t.marketplace.errNeedLogin);
        return;
      }
      if (res.status === 503) {
        setError(t.marketplace.errServiceUnavailable);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? t.marketplace.errGeneric);
        return;
      }
      setMatches(data.matches ?? []);
    } catch {
      setError(t.marketplace.errRetry);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-5">
        <Link
          href="/lost-found"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#0E4A5C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common.categories.lostFound}
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0E4A5C]" />
            <h1 className="text-xl font-bold text-[#0F2830]">{t.marketplace.aiPhotoSearch}</h1>
          </div>
          <p className="text-sm text-stone-500">
            {t.marketplace.matchIntro}
          </p>

          <label className="block">
            <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#0E4A5C]/40 transition-colors">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="mx-auto max-h-56 rounded-lg object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-stone-400">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">{t.marketplace.uploadPrompt}</span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          {status !== "authenticated" ? (
            <p className="text-sm text-stone-500 text-center">
              {t.marketplace.needLoginPrefix}{" "}
              <Link href="/login" className="text-[#0E4A5C] font-semibold hover:underline">
                {t.marketplace.loginLink}
              </Link>
            </p>
          ) : (
            <button
              type="button"
              onClick={run}
              disabled={!payload || loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? t.marketplace.comparing : t.marketplace.findMatches}
            </button>
          )}
        </div>

        {matches !== null && (
          <div className="space-y-3">
            {matches.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-sm text-stone-500">
                {t.marketplace.noMatches}
              </div>
            ) : (
              matches.map((m) => (
                <Link
                  key={m.id}
                  href={`/listings/${m.id}`}
                  className="flex items-center gap-4 bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="relative w-20 h-20 shrink-0 rounded-xl bg-stone-100 overflow-hidden">
                    {m.image ? (
                      <Image src={m.image} alt={m.breed} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CONF_CLASS[m.confidence]}`}>
                        {t.marketplace.conf[m.confidence]}
                      </span>
                      <span className="text-xs text-stone-400">
                        {m.status === "lost" ? t.marketplace.statusLostOption : t.marketplace.statusFoundOption}
                        {m.location ? ` · ${m.location}` : ""}
                      </span>
                    </div>
                    <p className="font-semibold text-[#0F2830] mt-1">{m.breed || t.marketplace.animalFallback}</p>
                    <p className="text-sm text-stone-500 line-clamp-2">{m.reason}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
