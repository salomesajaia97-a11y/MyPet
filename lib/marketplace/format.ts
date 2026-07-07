import type { PetSpecies } from "@/types/marketplace";

/** English species slug → Georgian label. Single source of truth for cards. */
export const SPECIES_KA: Record<PetSpecies, string> = {
  dog: "ძაღლი",
  cat: "კატა",
  bird: "ფრინველი",
  rabbit: "კურდღელი",
  reptile: "რეპტილია",
  other: "სხვა",
};

/** Localize a species slug, falling back to the raw value for unknown slugs. */
export function speciesKa(species: string): string {
  return SPECIES_KA[species as PetSpecies] ?? species;
}

/**
 * Age in months → Georgian label. Under a year reads in months, otherwise in
 * years plus any leftover months (e.g. 26 → "2 წელი 2 თვე").
 */
export function formatAge(months: number): string {
  if (!Number.isFinite(months) || months < 0) return "";
  if (months < 12) return `${months} თვე`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} წელი ${rem} თვე` : `${years} წელი`;
}
