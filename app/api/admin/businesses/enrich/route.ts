import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";
import { logAdminAction, requireAdmin } from "@/lib/admin/guard";
import {
  buildOverpassQuery,
  fieldsFromOsmTags,
  fillBlanksOnly,
  parseOsmId,
  type OsmElement,
  type OsmRef,
} from "@/lib/services/osmEnrich";
import {
  placeFromNominatim,
  reverseUrl,
  type GeocodedPlace,
  type NominatimResponse,
} from "@/lib/services/reverseGeocode";
import { getServerLocale } from "@/lib/i18n/server";

/**
 * Re-read OpenStreetMap for every imported business and fill in the blanks.
 *
 * Runs as an admin route rather than a local script on purpose: the database
 * URL only exists in the deployment's environment, and a script would need it
 * copied onto someone's laptop. This way the operation runs where the data
 * already is, behind the same role check as the rest of /admin, and lands in the
 * audit log.
 *
 * **Dry run unless `apply: true`.** The default response is a preview of every
 * change it would make, because the alternative is writing to 133 live rows on
 * the strength of a single click.
 */

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

/** Overpass and Nominatim both require a real contact in the User-Agent;
 * anonymous bulk querying is what gets an IP blocked, and their fair-use
 * policies are the reason this is a manual admin action rather than a cron. */
const USER_AGENT = "MyPetge.online/1.0 (+https://www.mypetge.online/contact)";

/** Ids per Overpass request. Measured, not guessed: batches of 40 drew a 504 and
 * then a 429 from the public endpoint, so keep them small and retry. */
const BATCH_SIZE = 15;
const BATCH_ATTEMPTS = 3;

/**
 * Nominatim allows at most one request a second and no parallelism. The cap
 * bounds a single run inside the function timeout; run it again for the rest.
 */
const GEOCODE_LIMIT = 60;
const GEOCODE_DELAY_MS = 1100;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const maxDuration = 300;

interface RowReport {
  id: string;
  name: string;
  category: string;
  /** Fields that would be (or were) written, with their new values. */
  changes: Record<string, unknown>;
}

async function fetchOverpass(refs: OsmRef[]): Promise<OsmElement[]> {
  const res = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain", "User-Agent": USER_AGENT },
    body: buildOverpassQuery(refs),
    signal: AbortSignal.timeout(90_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Overpass responded ${res.status}`);
  const data = (await res.json()) as { elements?: OsmElement[] };
  return data.elements ?? [];
}

/**
 * One batch, retried with a growing pause.
 *
 * The public Overpass instance answers 504 when it is loaded and 429 when it
 * decides you have asked enough; both clear on their own within seconds, and
 * giving up on the first one silently reduces coverage.
 */
async function fetchOverpassWithRetry(refs: OsmRef[]): Promise<OsmElement[]> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= BATCH_ATTEMPTS; attempt++) {
    try {
      return await fetchOverpass(refs);
    } catch (err) {
      lastError = err;
      if (attempt < BATCH_ATTEMPTS) await sleep(attempt * 3000);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Overpass failed");
}

/** Reverse-geocode one point. Returns null on any failure — a missing address
 * stays missing, which is the same state as before the run. */
async function reverseGeocode(
  lat: number,
  lng: number,
  locale: "ka" | "en"
): Promise<GeocodedPlace | null> {
  try {
    const res = await fetch(reverseUrl(lat, lng, locale), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return placeFromNominatim((await res.json()) as NominatimResponse);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let apply = false;
  try {
    ({ apply = false } = await req.json());
  } catch {
    /* no body means dry run */
  }

  try {
    const locale = await getServerLocale();
    await connectDB();
    // Every imported row, plus any row at all that still has no address but does
    // have coordinates — the second pass can help those even if they were
    // hand-entered rather than imported.
    const businesses = await BusinessModel.find({
      $or: [{ placeId: /^osm:/ }, { address: { $in: ["", null] } }],
    })
      .select("name category placeId address neighborhood phone website openingHours is24h city lat lng")
      .limit(1000)
      .lean<
        {
          _id: { toString(): string };
          name: string;
          category: string;
          placeId?: string;
          address?: string;
          neighborhood?: string;
          phone?: string;
          website?: string;
          openingHours?: string[];
          is24h?: boolean;
          city?: string;
          lat?: number;
          lng?: number;
        }[]
      >();

    // Index by OSM ref so a response element can be matched back to its row.
    const byRef = new Map<string, (typeof businesses)[number]>();
    const refs: OsmRef[] = [];
    for (const b of businesses) {
      const ref = parseOsmId(b.placeId);
      if (!ref) continue; // hand-seeded row, nothing to re-read
      byRef.set(`${ref.type}/${ref.id}`, b);
      refs.push(ref);
    }

    const elements: OsmElement[] = [];
    const failures: string[] = [];
    for (let i = 0; i < refs.length; i += BATCH_SIZE) {
      const batch = refs.slice(i, i + BATCH_SIZE);
      try {
        elements.push(...(await fetchOverpassWithRetry(batch)));
      } catch (err) {
        // One failed batch must not lose the ones that worked — report and go on.
        failures.push(err instanceof Error ? err.message : "unknown error");
      }
    }

    // Accumulate per row, because a row can be touched by both passes and the
    // second must see what the first decided (otherwise it re-fills the city).
    const pending = new Map<string, { row: (typeof businesses)[number]; changes: Record<string, unknown> }>();
    const stage = (row: (typeof businesses)[number], changes: Record<string, unknown>) => {
      if (Object.keys(changes).length === 0) return;
      const key = row._id.toString();
      const existing = pending.get(key);
      if (existing) Object.assign(existing.changes, changes);
      else pending.set(key, { row, changes: { ...changes } });
    };

    // Pass 1 — the OSM objects themselves. Cheap, one request per 15 rows, and
    // authoritative where the mappers filled anything in.
    for (const el of elements) {
      const row = byRef.get(`${el.type}/${el.id}`);
      if (!row) continue;
      stage(row, fillBlanksOnly(row, fieldsFromOsmTags(el, locale)));
    }

    // Pass 2 — reverse-geocode the rows that still have no address.
    //
    // This is the pass that actually fills them: for every row missing an
    // address, the OSM object has no `addr:*` tags either, so pass 1 alone
    // changes nothing. What OSM does know is the street the point sits on.
    let geocoded = 0;
    let geocodeSkipped = 0;
    const geocodeCandidates = businesses.filter((b) => {
      const staged = pending.get(b._id.toString())?.changes ?? {};
      const willHaveAddress = b.address?.trim() || staged.address;
      return !willHaveAddress && typeof b.lat === "number" && typeof b.lng === "number";
    });
    for (const row of geocodeCandidates) {
      if (geocoded >= GEOCODE_LIMIT) {
        geocodeSkipped = geocodeCandidates.length - geocoded;
        break;
      }
      const place = await reverseGeocode(row.lat!, row.lng!, locale);
      geocoded++;
      // One request per second, sequentially — Nominatim's policy, not a
      // guess, and the reason this runs as a capped manual action.
      await sleep(GEOCODE_DELAY_MS);
      if (!place) continue;
      const staged = pending.get(row._id.toString())?.changes ?? {};
      stage(
        row,
        fillBlanksOnly(
          { ...row, city: (staged.city as string) ?? row.city },
          { address: place.address, city: place.city }
        )
      );
      if (place.neighborhood && !row.neighborhood?.trim()) {
        stage(row, { neighborhood: place.neighborhood });
      }
    }

    const reports: RowReport[] = [];
    for (const { row, changes } of pending.values()) {
      reports.push({
        id: row._id.toString(),
        name: row.name,
        category: row.category,
        changes,
      });
      if (apply) {
        await BusinessModel.updateOne({ _id: row._id }, { $set: changes });
      }
    }

    // Count each field so the preview says "31 addresses, 24 phones" rather than
    // making someone read 60 rows to find out what the run would do.
    const fieldCounts: Record<string, number> = {};
    for (const r of reports) {
      for (const key of Object.keys(r.changes)) {
        fieldCounts[key] = (fieldCounts[key] ?? 0) + 1;
      }
    }

    if (apply && reports.length) {
      await logAdminAction(actor, "businesses.enrich", {
        type: "business",
        summary: `Filled ${reports.length} imported businesses from OpenStreetMap (${Object.entries(
          fieldCounts
        )
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")})`,
      });
    }

    return NextResponse.json({
      applied: apply,
      osmRows: refs.length,
      matched: elements.length,
      geocoded,
      // Never let a cap read as "that was everything".
      geocodeSkipped,
      changed: reports.length,
      fieldCounts,
      failures,
      reports: reports.slice(0, 200),
    });
  } catch (err) {
    console.error("[admin] enrich failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Enrichment failed" }, { status: 500 });
  }
}
