"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { useT } from "@/components/i18n/LanguageProvider";

const CATEGORY_VALUES = [
  "vet-clinics",
  "pet-hotels",
  "pet-shops",
  "pet-friendly",
] as const;

export default function NewServicePage() {
  const router = useRouter();
  const { t } = useT();
  const { status } = useSession();

  const categories = CATEGORY_VALUES.map((value) => ({
    value,
    label:
      t.services.new.categoryLabels[
        value === "vet-clinics"
          ? "vetClinics"
          : value === "pet-hotels"
            ? "petHotels"
            : value === "pet-shops"
              ? "petShops"
              : "petFriendly"
      ],
  }));
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    const body = {
      ...data,
      images,
      is24h: data.is24h === "on",
      hasEmergency: data.hasEmergency === "on",
    };

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/services/${data.category}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? t.services.new.error);
      }
      // Submission goes to the moderation queue — confirm rather than redirect
      // to a list where it won't appear until approved.
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.services.new.error);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#EBF6FA] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
          <h1 className="text-xl font-bold text-[#0F2830]">{t.services.new.submittedTitle}</h1>
          <p className="text-sm text-stone-500">
            {t.services.new.submittedText}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              href="/services"
              className="bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              {t.services.new.backToServices}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#0F2830] mb-6">{t.services.new.title}</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldCategory}</label>
            <select name="category" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldPhotos}</label>
            <ImageUploader value={images} onChange={setImages} maxImages={5} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldName}</label>
            <input name="name" required placeholder={t.services.new.placeholderName} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldAddress}</label>
            <input name="address" required placeholder={t.services.new.placeholderAddress} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldCity}</label>
            <input name="city" required placeholder={t.services.new.placeholderCity} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldPhone}</label>
            <input name="phone" required placeholder="+995 32 2 XX XX XX" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldDescription}</label>
            <textarea name="description" required rows={4} placeholder={t.services.new.placeholderDescription} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20 resize-none" />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" name="is24h" className="rounded" />
              {t.services.new.open24h}
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" name="hasEmergency" className="rounded" />
              {t.services.new.emergency}
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#0E4A5C] text-white font-semibold rounded-xl hover:bg-[#0B3D4E] transition-colors disabled:opacity-50"
          >
            {submitting ? t.services.new.submitting : t.services.new.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
