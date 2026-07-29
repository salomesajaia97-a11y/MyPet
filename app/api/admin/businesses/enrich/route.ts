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

/** Overpass asks for a real contact in the User-Agent; anonymous bulk querying
 * is what gets an IP blocked, and their fair-use policy is the reason this is a
 * manual admin action rather than a cron. */
const USER_AGENT = "MyPetge.online/1.0 (+https://www.mypetge.online/contact)";

/** Ids per Overpass request. Well within its limits, and small enough that one
 * slow response doesn't burn the whole function timeout. */
const BATCH_SIZE = 40;

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
    await connectDB();
    const businesses = await BusinessModel.find({ placeId: /^osm:/ })
      .select("name category placeId address phone website openingHours is24h city")
      .limit(1000)
      .lean<
        {
          _id: { toString(): string };
          name: string;
          category: string;
          placeId: string;
          address?: string;
          phone?: string;
          website?: string;
          openingHours?: string[];
          is24h?: boolean;
          city?: string;
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
        elements.push(...(await fetchOverpass(batch)));
      } catch (err) {
        // One failed batch must not lose the ones that worked — report and go on.
        failures.push(err instanceof Error ? err.message : "unknown error");
      }
    }

    const reports: RowReport[] = [];
    for (const el of elements) {
      const row = byRef.get(`${el.type}/${el.id}`);
      if (!row) continue;
      const changes = fillBlanksOnly(row, fieldsFromOsmTags(el));
      if (Object.keys(changes).length === 0) continue;
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
