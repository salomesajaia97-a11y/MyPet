import { NextRequest, NextResponse } from "next/server";
import { aiEnabled, parseSearchQuery } from "@/lib/ai";
import { rateLimit } from "@/lib/rateLimit";
import { auth } from "@/auth";

const VALID_TYPES = ["buy-sell", "adoption", "mating", "lost-found"];

export async function POST(req: NextRequest) {
  if (!aiEnabled()) {
    return NextResponse.json(
      { error: "AI search is not configured (set ANTHROPIC_API_KEY)." },
      { status: 503 }
    );
  }

  // Each call hits the paid model. Require a session and key the limit on the
  // user id — an IP-only limit lets anyone rotate IPs to burn the quota.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`ai-search:${session.user.id}`, 20, 10 * 60_000);
  if (limited) return limited;

  let query: unknown;
  try {
    ({ query } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof query !== "string" || query.trim().length < 2 || query.length > 300) {
    return NextResponse.json({ error: "Query must be 2–300 characters" }, { status: 400 });
  }

  let filters;
  try {
    filters = await parseSearchQuery(query.trim());
  } catch (err) {
    console.error("[ai-search]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "AI search failed" }, { status: 502 });
  }
  if (!filters) {
    return NextResponse.json({ error: "Could not understand the query" }, { status: 422 });
  }

  const base = VALID_TYPES.includes(filters.type) ? `/${filters.type}` : "/buy-sell";
  const params = new URLSearchParams();
  if (filters.species) params.set("species", filters.species);
  if (filters.city) params.set("city", filters.city);
  if (filters.q) params.set("q", filters.q);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.sex) params.set("sex", filters.sex);
  if (filters.status) params.set("status", filters.status);

  const qs = params.toString();
  return NextResponse.json({ redirect: qs ? `${base}?${qs}` : base, filters });
}
