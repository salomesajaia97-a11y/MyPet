"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { useT } from "@/components/i18n/LanguageProvider";
import { CITIES } from "@/lib/marketplace/filters";
import type { Listing, PetSpecies } from "@/types/marketplace";

const SPECIES_VALUES: PetSpecies[] = [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "reptile",
  "other",
];

const inputCls =
  "w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20";

/** Split a stored "<city>, <district>" location back into its two parts. */
function splitLocation(location: string): { city: string; district: string } {
  const idx = location.indexOf(",");
  if (idx === -1) return { city: location.trim(), district: "" };
  return {
    city: location.slice(0, idx).trim(),
    district: location.slice(idx + 1).trim(),
  };
}

export default function EditListingPage() {
  const { t } = useT();
  const typeLabels: Record<string, string> = {
    "buy-sell": t.listings.types.buySell,
    adoption: t.listings.types.adoption,
    mating: t.listings.types.mating,
    "lost-found": t.listings.types.lostFound,
  };
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundErr, setNotFoundErr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/marketplace/listing/${id}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("not found");
        const { listing } = await res.json();
        if (!active) return;
        setListing(listing);
        setImages(listing.images ?? []);
      } catch {
        if (active) setNotFoundErr(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!listing) return;
    if (images.length === 0) {
      setError(t.listings.form.photoRequired);
      return;
    }

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const type = listing.type;

    const body: Record<string, unknown> = {
      ...data,
      images,
      age: Number(data.age),
      // Keep the same "<city>, <district>" shape the create form writes so the
      // city filter keeps matching.
      location: [data.city, data.district].filter(Boolean).join(", "),
    };
    delete body.city;
    delete body.district;

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
      const res = await fetch(`/api/marketplace/listing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? t.listings.form.genericError);
      }
      router.push(`/listings/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.listings.form.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBF6FA] flex items-center justify-center">
        <p className="text-stone-500 text-sm">{t.common.actions.loading}</p>
      </div>
    );
  }

  if (notFoundErr || !listing) {
    return (
      <div className="min-h-screen bg-[#EBF6FA] flex flex-col items-center justify-center gap-4">
        <p className="text-stone-600">{t.listings.editListing.notFound}</p>
        <Link href="/buy-sell" className="text-sm text-[#0E4A5C] font-semibold">
          {t.listings.detail.back}
        </Link>
      </div>
    );
  }

  const { city, district } = splitLocation(listing.location);
  const type = listing.type;

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link
          href={`/listings/${id}`}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#0E4A5C] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          უკან დაბრუნება
        </Link>

        <h1 className="text-2xl font-bold text-[#0F2830] mb-6">
          განცხადების რედაქტირება
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 space-y-6 shadow-sm"
        >
          {/* Category is fixed on edit */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              კატეგორია
            </label>
            <span className="inline-block bg-[#EBF6FA] text-[#0E4A5C] text-sm font-medium px-3 py-1.5 rounded-xl">
              {typeLabels[type]}
            </span>
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
            <select name="species" required defaultValue={listing.species} className={inputCls}>
              {SPECIES_VALUES.map((s) => (
                <option key={s} value={s}>{t.listings.species[s]}</option>
              ))}
            </select>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ჯიში</label>
            <input name="breed" required defaultValue={listing.breed} className={inputCls} />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ასაკი (თვეებში)</label>
            <input name="age" type="number" min="0" required defaultValue={listing.age} className={inputCls} />
          </div>

          {/* Type-specific fields */}
          {listing.type === "buy-sell" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ფასი (₾)</label>
                <input name="price" type="number" min="0" required defaultValue={listing.price ?? ""} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ვალუტა</label>
                <select name="currency" defaultValue={listing.currency ?? "GEL"} className={inputCls}>
                  <option value="GEL">GEL ₾</option>
                  <option value="USD">USD $</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">პედიგრი</label>
                <select name="pedigree" defaultValue={listing.pedigree ?? "none"} className={inputCls}>
                  <option value="none">არ აქვს</option>
                  <option value="FCI">FCI</option>
                  <option value="FCG">FCG</option>
                </select>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="vaccinated" defaultChecked={listing.vaccinated} className="rounded" />
                  ვაქცინირებული
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="hasPassport" defaultChecked={listing.hasPassport} className="rounded" />
                  პასპორტი
                </label>
              </div>
            </>
          )}

          {listing.type === "adoption" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  ხასიათი (მძიმით გამოყოფილი)
                </label>
                <input
                  name="temperament"
                  defaultValue={(listing.temperament ?? []).join(", ")}
                  placeholder="მაგ: მშვიდი, მოთამაშე, ერთგული"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="spayedNeutered" defaultChecked={listing.spayedNeutered} className="rounded" />
                  დაკასტრირებული / სტერილიზებული
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="goodWithKids" defaultChecked={listing.goodWithKids} className="rounded" />
                  ბავშვებთან თავსებადი
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="goodWithPets" defaultChecked={listing.goodWithPets} className="rounded" />
                  სხვა ცხოველებთან თავსებადი
                </label>
              </div>
            </>
          )}

          {listing.type === "mating" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">სქესი</label>
                <select name="sex" required defaultValue={listing.sex} className={inputCls}>
                  <option value="male">მამრი</option>
                  <option value="female">მდედრი</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">წონა (კგ)</label>
                <input name="weight" type="number" min="0" step="0.1" required defaultValue={listing.weight ?? ""} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">პედიგრი</label>
                <select name="pedigree" defaultValue={listing.pedigree ?? "none"} className={inputCls}>
                  <option value="none">არ აქვს</option>
                  <option value="FCI">FCI</option>
                  <option value="FCG">FCG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ფასი (₾, სურვილისამებრ)</label>
                <input name="price" type="number" min="0" defaultValue={listing.price ?? ""} placeholder="ცარიელი = უფასო" className={inputCls} />
              </div>
            </>
          )}

          {listing.type === "lost-found" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">სტატუსი</label>
                <select name="status" required defaultValue={listing.status} className={inputCls}>
                  <option value="lost">დაკარგული</option>
                  <option value="found">ნაპოვნი</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">უბანი</label>
                <input name="neighborhood" required defaultValue={listing.neighborhood ?? ""} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">უკანასკნელი ნახვის თარიღი</label>
                <input name="lastSeenDate" type="date" required defaultValue={listing.lastSeenDate ?? ""} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ჯილდო (₾, სურვილისამებრ)</label>
                <input name="reward" type="number" min="0" defaultValue={listing.reward ?? ""} placeholder="ცარიელი = ჯილდო არ არის" className={inputCls} />
              </div>
            </>
          )}

          {/* Common fields */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ქალაქი</label>
            <select name="city" required defaultValue={city} className={inputCls}>
              {/* Keep the stored city selectable even if it's outside the short list. */}
              {!CITIES.includes(city as (typeof CITIES)[number]) && city && (
                <option value={city}>{city}</option>
              )}
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">უბანი / მისამართი (სურვილისამებრ)</label>
            <input name="district" defaultValue={district} placeholder="მაგ: ვაკე" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">აღწერა</label>
            <textarea name="description" required rows={4} defaultValue={listing.description} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">საკონტაქტო სახელი</label>
            <input name="contactName" required defaultValue={listing.contactName} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ტელეფონი</label>
            <input name="contactPhone" required defaultValue={listing.contactPhone} className={inputCls} />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#0E4A5C] text-white font-semibold rounded-xl hover:bg-[#0B3D4E] transition-colors disabled:opacity-50"
          >
            {submitting ? "ინახება..." : "ცვლილებების შენახვა"}
          </button>
        </form>
      </div>
    </div>
  );
}
