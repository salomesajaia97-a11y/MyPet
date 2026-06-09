"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ImageUploader } from "@/components/ui/ImageUploader";

const CATEGORIES = [
  { value: "vet-clinics", label: "ვეტ-კლინიკა" },
  { value: "pet-hotels", label: "სასტუმრო" },
  { value: "pet-shops", label: "მაღაზია" },
  { value: "pet-friendly", label: "Pet-Friendly" },
];

export default function NewServicePage() {
  const router = useRouter();
  const { status } = useSession();
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(json.error ?? "შეცდომა");
      }
      router.push(`/services/${data.category}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "შეცდომა");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#0F2830] mb-6">სერვისის დამატება</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">კატეგორია</label>
            <select name="category" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ფოტოები</label>
            <ImageUploader value={images} onChange={setImages} maxImages={5} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">სახელი</label>
            <input name="name" required placeholder="ბიზნესის სახელი" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">მისამართი</label>
            <input name="address" required placeholder="ქუჩა, N" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ქალაქი</label>
            <input name="city" required placeholder="მაგ: თბილისი" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ტელეფონი</label>
            <input name="phone" required placeholder="+995 32 2 XX XX XX" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">აღწერა</label>
            <textarea name="description" required rows={4} placeholder="სერვისის აღწერა..." className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20 resize-none" />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" name="is24h" className="rounded" />
              24/7 გახსნილია
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" name="hasEmergency" className="rounded" />
              სასწრაფო სერვისი
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
            {submitting ? "იგზავნება..." : "სერვისის დამატება"}
          </button>
        </form>
      </div>
    </div>
  );
}
