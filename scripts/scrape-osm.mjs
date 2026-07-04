// Free, keyless place scraper using the OpenStreetMap Overpass API.
// Pulls vet clinics, pet hotels/boarding, pet shops and pet-friendly spots
// across Georgia and upserts them into the `businesses` collection.
//
// Run:  node scripts/scrape-osm.mjs
//
// OSM has no ratings or photos, so those stay empty (rating 0, no image).
import fs from "fs";
import mongoose from "mongoose";

// Multiple public Overpass mirrors — we rotate/fall back on rate limits.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// category -> { overpass selectors, Georgian label }
const CATEGORIES = {
  "vet-clinics": {
    label: "ვეტერინარული კლინიკა",
    selectors: ['["amenity"="veterinary"]'],
  },
  "pet-hotels": {
    label: "ცხოველთა სასტუმრო / პანსიონი",
    selectors: ['["amenity"="animal_boarding"]', '["amenity"="animal_shelter"]'],
  },
  "pet-shops": {
    label: "ზოომაღაზია",
    selectors: ['["shop"="pet"]'],
  },
  "pet-friendly": {
    label: "Pet-friendly ადგილი",
    selectors: ['["dog"="yes"]', '["pets"="yes"]'],
  },
};

function buildQuery(selectors) {
  // Georgia (ISO 3166-1 = GE) as the search area.
  const body = selectors
    .map(
      (s) =>
        `  node${s}(area.ge);\n  way${s}(area.ge);\n  relation${s}(area.ge);`
    )
    .join("\n");
  return `[out:json][timeout:90];
area["ISO3166-1"="GE"][admin_level=2]->.ge;
(
${body}
);
out center tags;`;
}

async function overpass(query) {
  let lastErr;
  // Try each mirror; on rate-limit (429) back off and retry a couple times.
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            "User-Agent":
              "MyPet-directory/1.0 (petcare app; contact admin@mypet.ge)",
          },
          body: "data=" + encodeURIComponent(query),
        });
        if (res.status === 429 || res.status === 504) {
          lastErr = new Error(`${res.status} on ${endpoint}`);
          await sleep(15000 * (attempt + 1)); // 15s, 30s, 45s
          continue;
        }
        if (!res.ok) throw new Error(`Overpass ${res.status}: ${await res.text()}`);
        const json = await res.json();
        return json.elements ?? [];
      } catch (e) {
        lastErr = e;
        await sleep(3000);
      }
    }
  }
  throw lastErr ?? new Error("All Overpass endpoints failed");
}

// Best-effort: pull a representative photo from a place's own website by
// reading its Open Graph / Twitter card image meta tag.
async function fetchSiteImage(website) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(website, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MyPet-directory/1.0)" },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 200000);
    const m =
      html.match(
        /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]+content=["']([^"']+)["']/i
      ) ||
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i
      );
    if (!m) return null;
    let url = m[1].trim();
    if (url.startsWith("//")) url = "https:" + url;
    else if (url.startsWith("/")) url = new URL(url, website).href;
    return url.startsWith("http") ? url : null;
  } catch {
    return null;
  }
}

// Run async task over items with a small concurrency cap.
async function pool(items, limit, fn) {
  const q = [...items];
  const workers = Array.from({ length: limit }, async () => {
    while (q.length) await fn(q.shift());
  });
  await Promise.all(workers);
}

function toDoc(el, category, label) {
  const t = el.tags ?? {};
  const name = t.name || t["name:ka"] || t["name:en"];
  if (!name) return null; // unnamed places are useless in a directory

  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;

  const streetLine = [t["addr:street"], t["addr:housenumber"]]
    .filter(Boolean)
    .join(" ");
  const address =
    streetLine || t["addr:full"] || t["addr:place"] || t["addr:city"] || "";
  const city = t["addr:city"] || "";
  const neighborhood =
    t["addr:suburb"] || t["addr:district"] || t["addr:city"] || "";
  const phone = t.phone || t["contact:phone"] || t["contact:mobile"] || "";
  const website = t.website || t["contact:website"] || undefined;
  const oh = t.opening_hours;

  // Drop useless entries: if there's no phone, no address and no website,
  // it's just a dot on a map — not worth listing.
  if (!phone && !address && !website) return null;

  // OSM occasionally carries a photo via `image` (direct URL) or
  // `wikimedia_commons` (a "File:..." reference we resolve to a real URL).
  const images = [];
  if (t.image?.startsWith("http")) images.push(t.image);
  else if (t.wikimedia_commons?.startsWith("File:")) {
    images.push(
      "https://commons.wikimedia.org/wiki/Special:FilePath/" +
        encodeURIComponent(t.wikimedia_commons.slice("File:".length))
    );
  }

  return {
    placeId: `osm:${el.type}/${el.id}`,
    category,
    source: "osm",
    name,
    description: `${label}${city !== "—" ? " — " + city : ""}`,
    address,
    neighborhood,
    city,
    phone,
    website,
    images,
    tags: [label],
    openingHours: oh ? [oh] : [],
    is24h: oh === "24/7",
    hasEmergency: false,
    aggregateRating: 0,
    googleRatingCount: 0,
    lat,
    lng,
    status: "approved",
    updatedAt: new Date(),
  };
}

async function main() {
  const env = fs.readFileSync(".env.local", "utf8");
  const m = env.match(/^MONGODB_URI=(.+)$/m);
  if (!m) throw new Error("MONGODB_URI not found in .env.local");
  const uri = m[1].trim().replace(/^["']|["']$/g, "");

  await mongoose.connect(uri, { bufferCommands: false });
  const col = mongoose.connection.collection("businesses");

  let grand = 0;
  for (const [category, cfg] of Object.entries(CATEGORIES)) {
    process.stdout.write(`\n${category}: querying OSM... `);
    let elements = [];
    try {
      elements = await overpass(buildQuery(cfg.selectors));
    } catch (e) {
      console.log(`FAILED (${e.message}) — keeping existing rows`);
      continue;
    }
    const docs = elements.map((el) => toDoc(el, category, cfg.label)).filter(Boolean);
    console.log(`${elements.length} raw, ${docs.length} kept`);

    // Only now that the fetch succeeded, replace this category's OSM rows.
    // Curated (source:"seed") rows are never touched.
    await col.deleteMany({ source: "osm", category });

    // Fill missing photos from each place's website (og:image).
    const needImg = docs.filter((d) => d.website && d.images.length === 0);
    process.stdout.write(`  fetching photos for ${needImg.length} sites... `);
    let gotImg = 0;
    await pool(needImg, 8, async (d) => {
      const img = await fetchSiteImage(d.website);
      if (img) {
        d.images.push(img);
        gotImg++;
      }
    });
    console.log(`${gotImg} found`);

    let upserted = 0;
    for (const d of docs) {
      const { placeId, ...rest } = d;
      const r = await col.updateOne(
        { placeId },
        { $set: rest, $setOnInsert: { placeId, createdAt: new Date() } },
        { upsert: true }
      );
      if (r.upsertedCount || r.modifiedCount) upserted++;
    }
    grand += docs.length;
    console.log(`  → ${upserted} upserted into DB`);
    // be polite to the shared public Overpass instance
    await sleep(8000);
  }

  console.log(`\nDone. ${grand} places processed.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
