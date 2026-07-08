"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { useT } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils/cn";
import { CITIES } from "@/lib/marketplace/filters";
import type { MarketplaceType, PetSpecies } from "@/types/marketplace";

const TYPE_VALUES: MarketplaceType[] = [
  "buy-sell",
  "adoption",
  "mating",
  "lost-found",
];

// Accept `?category=<type>` (e.g. from the SOS banner → "lost-found") to
// pre-select the listing type. Falls back to "buy-sell" for missing/unknown
// values so a stray query string can never break the form.
function initialType(category: string | null): MarketplaceType {
  return TYPE_VALUES.includes(category as MarketplaceType)
    ? (category as MarketplaceType)
    : "buy-sell";
}

const SPECIES_VALUES: PetSpecies[] = [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "reptile",
  "other",
];

function NewListingForm() {
  const { t } = useT();
  const typeLabels: Record<MarketplaceType, string> = {
    "buy-sell": t.listings.types.buySell,
    adoption: t.listings.types.adoption,
    mating: t.listings.types.mating,
    "lost-found": t.listings.types.lostFound,
  };
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
      setError(t.listings.form.photoRequired);
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
        throw new Error(json.error ?? t.listings.form.genericError);
      }
      router.push(`/${type}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.listings.form.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#0F2830] mb-6">{t.listings.newListing.title}</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-6 shadow-sm">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.category}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPE_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={cn(
                    "py-2 px-3 rounded-xl text-sm font-medium border transition-all",
                    type === value
                      ? "bg-[#0E4A5C] text-white border-[#0E4A5C]"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  )}
                >
                  {typeLabels[value]}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              {t.listings.form.photos} <span className="text-red-500">*</span>
            </label>
            <ImageUploader value={images} onChange={setImages} maxImages={5} />
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.species}</label>
            <select name="species" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
              {SPECIES_VALUES.map((value) => (
                <option key={value} value={value}>{t.listings.species[value]}</option>
              ))}
            </select>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.breed}</label>
            <input name="breed" required placeholder={t.listings.form.breedPlaceholder} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.age}</label>
            <input name="age" type="number" min="0" required placeholder={t.listings.form.agePlaceholder} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          {/* Type-specific fields */}
          {type === "buy-sell" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.price}</label>
                <input name="price" type="number" min="0" required placeholder={t.listings.form.pricePlaceholder} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.currency}</label>
                <select name="currency" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="GEL">GEL ₾</option>
                  <option value="USD">USD $</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.pedigree}</label>
                <select name="pedigree" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="none">{t.listings.form.pedigreeNone}</option>
                  <option value="FCI">FCI</option>
                  <option value="FCG">FCG</option>
                </select>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="vaccinated" className="rounded" />
                  {t.listings.form.vaccinated}
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="hasPassport" className="rounded" />
                  {t.listings.form.passport}
                </label>
              </div>
            </>
          )}

          {type === "adoption" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  {t.listings.form.temperament}
                </label>
                <input
                  name="temperament"
                  placeholder={t.listings.form.temperamentPlaceholder}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20"
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="spayedNeutered" className="rounded" />
                  {t.listings.form.spayedNeutered}
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="goodWithKids" className="rounded" />
                  {t.listings.form.goodWithKids}
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="goodWithPets" className="rounded" />
                  {t.listings.form.goodWithPets}
                </label>
              </div>
            </>
          )}

          {type === "mating" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.sex}</label>
                <select name="sex" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="male">{t.listings.form.male}</option>
                  <option value="female">{t.listings.form.female}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.weight}</label>
                <input name="weight" type="number" min="0" step="0.1" required placeholder={t.listings.form.weightPlaceholder} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.pedigree}</label>
                <select name="pedigree" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="none">{t.listings.form.pedigreeNone}</option>
                  <option value="FCI">FCI</option>
                  <option value="FCG">FCG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.priceOptional}</label>
                <input name="price" type="number" min="0" placeholder={t.listings.form.priceFreePlaceholder} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
            </>
          )}

          {type === "lost-found" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.status}</label>
                <select name="status" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="lost">{t.listings.form.lost}</option>
                  <option value="found">{t.listings.form.found}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.neighborhood}</label>
                <input name="neighborhood" required placeholder={t.listings.form.neighborhoodPlaceholder} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.lastSeenDate}</label>
                <input name="lastSeenDate" type="date" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.reward}</label>
                <input name="reward" type="number" min="0" placeholder={t.listings.form.rewardPlaceholder} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
            </>
          )}

          {/* Common fields */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.city}</label>
            <select name="city" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.district}</label>
            <input name="district" placeholder={t.listings.form.districtPlaceholder} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.description}</label>
            <textarea name="description" required rows={4} placeholder={t.listings.form.descriptionPlaceholder} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.contactName}</label>
            <input name="contactName" required placeholder={t.listings.form.contactNamePlaceholder} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">{t.listings.form.phone}</label>
            <input name="contactPhone" required placeholder={t.listings.form.phonePlaceholder} className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#0E4A5C] text-white font-semibold rounded-xl hover:bg-[#0B3D4E] transition-colors disabled:opacity-50"
          >
            {submitting ? t.listings.newListing.submitting : t.listings.newListing.submit}
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
