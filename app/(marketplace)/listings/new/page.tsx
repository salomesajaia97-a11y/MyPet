"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { cn } from "@/lib/utils/cn";
import { CITIES } from "@/lib/marketplace/filters";
import type { MarketplaceType, PetSpecies } from "@/types/marketplace";

const TYPES: { value: MarketplaceType; label: string }[] = [
  { value: "buy-sell", label: "გაყიდვა" },
  { value: "adoption", label: "გაჩუქება" },
  { value: "mating", label: "შეჯვარება" },
  { value: "lost-found", label: "დაკარგული/ნაპოვნი" },
];

// Accept `?category=<type>` (e.g. from the SOS banner → "lost-found") to
// pre-select the listing type. Falls back to "buy-sell" for missing/unknown
// values so a stray query string can never break the form.
function initialType(category: string | null): MarketplaceType {
  return TYPES.some((t) => t.value === category)
    ? (category as MarketplaceType)
    : "buy-sell";
}

const SPECIES: { value: PetSpecies; label: string }[] = [
  { value: "dog", label: "ძაღლი" },
  { value: "cat", label: "კატა" },
  { value: "bird", label: "ფრინველი" },
  { value: "rabbit", label: "კურდღელი" },
  { value: "reptile", label: "რეპტილია" },
  { value: "other", label: "სხვა" },
];

function NewListingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState<MarketplaceType>(() =>
    initialType(searchParams.get("category"))
  );
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (images.length === 0) {
      setError("გთხოვთ დაამატოთ სულ მცირე 1 ფოტო");
      return;
    }

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    const body: Record<string, unknown> = {
      ...data,
      images,
      age: Number(data.age),
      // Store location as "<city>, <district>" so the city filter matches.
      location: [data.city, data.district].filter(Boolean).join(", "),
    };

    if (type === "buy-sell") {
      body.price = Number(data.price);
      body.vaccinated = data.vaccinated === "on";
      body.hasPassport = data.hasPassport === "on";
    }
    if (type === "adoption") {
      body.temperament =
        typeof data.temperament === "string"
          ? data.temperament.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
      body.spayedNeutered = data.spayedNeutered === "on";
      body.goodWithKids = data.goodWithKids === "on";
      body.goodWithPets = data.goodWithPets === "on";
    }
    if (type === "mating") {
      body.price = data.price ? Number(data.price) : null;
      body.weight = Number(data.weight);
    }
    if (type === "lost-found") {
      body.reward = data.reward ? Number(data.reward) : null;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/marketplace/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "შეცდომა");
      }
      router.push(`/${type}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "შეცდომა");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#0F2830] mb-6">განცხადების დამატება</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-6 shadow-sm">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">კატეგორია</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    "py-2 px-3 rounded-xl text-sm font-medium border transition-all",
                    type === t.value
                      ? "bg-[#0E4A5C] text-white border-[#0E4A5C]"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              ფოტოები <span className="text-red-500">*</span>
            </label>
            <ImageUploader value={images} onChange={setImages} maxImages={5} />
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">სახეობა</label>
            <select name="species" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
              {SPECIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ჯიში</label>
            <input name="breed" required placeholder="მაგ: ლაბრადორი" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ასაკი (თვეებში)</label>
            <input name="age" type="number" min="0" required placeholder="მაგ: 6" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          {/* Type-specific fields */}
          {type === "buy-sell" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ფასი (₾)</label>
                <input name="price" type="number" min="0" required placeholder="მაგ: 500" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ვალუტა</label>
                <select name="currency" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="GEL">GEL ₾</option>
                  <option value="USD">USD $</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">პედიგრი</label>
                <select name="pedigree" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="none">არ აქვს</option>
                  <option value="FCI">FCI</option>
                  <option value="FCG">FCG</option>
                </select>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="vaccinated" className="rounded" />
                  ვაქცინირებული
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="hasPassport" className="rounded" />
                  პასპორტი
                </label>
              </div>
            </>
          )}

          {type === "adoption" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  ხასიათი (მძიმით გამოყოფილი)
                </label>
                <input
                  name="temperament"
                  placeholder="მაგ: მშვიდი, მოთამაშე, ერთგული"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20"
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="spayedNeutered" className="rounded" />
                  დაკასტრირებული / სტერილიზებული
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="goodWithKids" className="rounded" />
                  ბავშვებთან თავსებადი
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="goodWithPets" className="rounded" />
                  სხვა ცხოველებთან თავსებადი
                </label>
              </div>
            </>
          )}

          {type === "mating" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">სქესი</label>
                <select name="sex" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="male">მამრი</option>
                  <option value="female">მდედრი</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">წონა (კგ)</label>
                <input name="weight" type="number" min="0" step="0.1" required placeholder="მაგ: 12.5" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">პედიგრი</label>
                <select name="pedigree" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="none">არ აქვს</option>
                  <option value="FCI">FCI</option>
                  <option value="FCG">FCG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ფასი (₾, სურვილისამებრ)</label>
                <input name="price" type="number" min="0" placeholder="ცარიელი = უფასო" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
            </>
          )}

          {type === "lost-found" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">სტატუსი</label>
                <select name="status" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="lost">დაკარგული</option>
                  <option value="found">ნაპოვნი</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">უბანი</label>
                <input name="neighborhood" required placeholder="მაგ: ვაკე" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">უკანასკნელი ნახვის თარიღი</label>
                <input name="lastSeenDate" type="date" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ჯილდო (₾, სურვილისამებრ)</label>
                <input name="reward" type="number" min="0" placeholder="ცარიელი = ჯილდო არ არის" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
            </>
          )}

          {/* Common fields */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ქალაქი</label>
            <select name="city" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">უბანი / მისამართი (სურვილისამებრ)</label>
            <input name="district" placeholder="მაგ: ვაკე" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">აღწერა</label>
            <textarea name="description" required rows={4} placeholder="დეტალური აღწერა..." className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">საკონტაქტო სახელი</label>
            <input name="contactName" required placeholder="სახელი" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ტელეფონი</label>
            <input name="contactPhone" required placeholder="+995 5XX XX XX XX" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#0E4A5C] text-white font-semibold rounded-xl hover:bg-[#0B3D4E] transition-colors disabled:opacity-50"
          >
            {submitting ? "იგზავნება..." : "განცხადების დამატება"}
          </button>
        </form>
      </div>
    </div>
  );
}

// `useSearchParams` bails out to client rendering, so wrap the form in a
// Suspense boundary to keep the route prerenderable (required in this Next.js).
export default function NewListingPage() {
  return (
    <Suspense>
      <NewListingForm />
    </Suspense>
  );
}
