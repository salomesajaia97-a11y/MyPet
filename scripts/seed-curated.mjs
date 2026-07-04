// Seeds the hand-curated businesses (with real photos, phones, ratings and
// coordinates) from lib/data/businesses.ts into the DB. These are richer than
// the OSM-scraped rows, so they anchor each category.
//
// Run:  node scripts/seed-curated.mjs
// Upserts by placeId ("seed:<id>") so re-running never duplicates.
import fs from "fs";
import mongoose from "mongoose";
// Node 24 strips TS types on import, so we can read the source data directly.
import { ALL_BUSINESSES } from "../lib/data/businesses.ts";

function toDoc(b) {
  return {
    placeId: `seed:${b._id}`,
    category: b.category,
    source: "seed",
    name: b.name,
    description: b.description,
    address: b.address,
    neighborhood: b.neighborhood,
    city: b.city,
    phone: b.phone,
    website: b.website,
    images: b.image ? [b.image] : [],
    tags: b.tags ?? [],
    openingHours: b.is24h ? ["24/7"] : [],
    is24h: !!b.is24h,
    hasEmergency: !!b.hasEmergency,
    indoorAllowed: b.indoorAllowed,
    pricePerNight: b.pricePerNight,
    aggregateRating: b.rating ?? 0,
    googleRatingCount: b.reviewCount ?? 0,
    lat: b.lat,
    lng: b.lng,
    status: "approved",
    updatedAt: new Date(),
  };
}

async function main() {
  const env = fs.readFileSync(".env.local", "utf8");
  const uri = env.match(/^MONGODB_URI=(.+)$/m)[1].trim().replace(/^["']|["']$/g, "");
  await mongoose.connect(uri, { bufferCommands: false });
  const col = mongoose.connection.collection("businesses");

  let n = 0;
  for (const b of ALL_BUSINESSES) {
    const { placeId, ...rest } = toDoc(b);
    await col.updateOne(
      { placeId },
      { $set: rest, $setOnInsert: { placeId, createdAt: new Date() } },
      { upsert: true }
    );
    n++;
  }
  console.log(`Seeded ${n} curated businesses.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
