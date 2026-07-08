"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { useT } from "@/components/i18n/LanguageProvider";

const CATEGORY_LABEL_KEYS: Record<
  string,
  "vetClinics" | "petHotels" | "petShops" | "petFriendly"
> = {
  "vet-clinics": "vetClinics",
  "pet-hotels": "petHotels",
  "pet-shops": "petShops",
  "pet-friendly": "petFriendly",
};

const inputCls =
  "w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20";

interface Service {
  _id: string;
  category: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  website?: string;
  images?: string[];
  is24h?: boolean;
  hasEmergency?: boolean;
}

export default function EditServicePage() {
  const router = useRouter();
  const { t } = useT();
  const params = useParams<{ category: string; id: string }>();
  const { category, id } = params;
  const { status } = useSession();

  const [service, setService] = useState<Service | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundErr, setNotFoundErr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/services/${category}/${id}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("not found");
        const { service } = await res.json();
        if (!active) return;
        setService(service);
        setImages(service.images ?? []);
      } catch {
        if (active) setNotFoundErr(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [category, id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!service) return;
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
      const res = await fetch(`/api/services/${category}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? t.services.new.error);
      }
      router.push(`/services/${category}/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.services.new.error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBF6FA] flex items-center justify-center">
        <p className="text-stone-500 text-sm">{t.services.edit.loading}</p>
      </div>
    );
  }

  if (notFoundErr || !service) {
    return (
      <div className="min-h-screen bg-[#EBF6FA] flex flex-col items-center justify-center gap-4">
        <p className="text-stone-600">{t.services.edit.notFound}</p>
        <Link href="/services" className="text-sm text-[#0E4A5C] font-semibold">
          {t.services.new.backToServices}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link
          href={`/services/${category}/${id}`}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#0E4A5C] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.services.edit.back}
        </Link>

        <h1 className="text-2xl font-bold text-[#0F2830] mb-6">{t.services.edit.title}</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-6 shadow-sm">
          {/* Category is fixed on edit */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldCategory}</label>
            <span className="inline-block bg-[#EBF6FA] text-[#0E4A5C] text-sm font-medium px-3 py-1.5 rounded-xl">
              {CATEGORY_LABEL_KEYS[service.category]
                ? t.services.new.categoryLabels[CATEGORY_LABEL_KEYS[service.category]]
                : service.category}
            </span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldPhotos}</label>
            <ImageUploader value={images} onChange={setImages} maxImages={5} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldName}</label>
            <input name="name" required defaultValue={service.name} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldAddress}</label>
            <input name="address" required defaultValue={service.address ?? ""} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldCity}</label>
            <input name="city" required defaultValue={service.city ?? ""} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldPhone}</label>
            <input name="phone" required defaultValue={service.phone ?? ""} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.edit.fieldWebsite}</label>
            <input name="website" defaultValue={service.website ?? ""} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.services.new.fieldDescription}</label>
            <textarea name="description" required rows={4} defaultValue={service.description ?? ""} className={`${inputCls} resize-none`} />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" name="is24h" defaultChecked={service.is24h} className="rounded" />
              {t.services.new.open24h}
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" name="hasEmergency" defaultChecked={service.hasEmergency} className="rounded" />
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
            {submitting ? t.services.edit.saving : t.services.edit.saveChanges}
          </button>
        </form>
      </div>
    </div>
  );
}
