import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import { buildListingFilter } from "@/lib/marketplace/filters";
import type { Listing } from "@/types/marketplace";

/** Listings shown per page on the browse routes. */
export const PAGE_SIZE = 24;

/** Parse a 1-based page number out of raw search params (defaults to 1). */
export function getPage(
  params: Record<string, string | string[] | undefined> = {}
): number {
  const raw = params.page;
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n > 1 ? n : 1;
}

/**
 * Fetch one page of listings of a given type straight from MongoDB.
 *
 * Server Components must query the DB directly — self-fetching our own API over
 * an absolute URL (NEXT_PUBLIC_APP_URL/localhost) silently returns nothing when
 * that env var is unset in production. Detail pages already do this; the list
 * pages now share the same path. The JSON round-trip serializes ObjectIds/Dates
 * to plain strings so results are safe to pass into client components.
 */
export async function getListings(
  type: string,
  params: Record<string, string | string[] | undefined> = {}
): Promise<Listing[]> {
  await connectDB();
  const page = getPage(params);
  const docs = await ListingModel.find(buildListingFilter(type, params))
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();
  return JSON.parse(JSON.stringify(docs)) as Listing[];
}

/** Total listings matching the same filter — for pagination controls. */
export async function countListings(
  type: string,
  params: Record<string, string | string[] | undefined> = {}
): Promise<number> {
  await connectDB();
  return ListingModel.countDocuments(buildListingFilter(type, params));
}
