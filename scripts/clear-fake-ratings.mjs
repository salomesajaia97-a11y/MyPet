// One-off cleanup: wipe the fabricated "Google" ratings that seeding wrote into
// the businesses collection, and recompute each business's rating from REAL
// native reviews only (0 when there are none). Idempotent — safe to re-run.
//
// Run:  node scripts/clear-fake-ratings.mjs
import fs from "fs";
import mongoose from "mongoose";

async function main() {
  const env = fs.readFileSync(".env.local", "utf8");
  const uri = env.match(/^MONGODB_URI=(.+)$/m)[1].trim().replace(/^["']|["']$/g, "");
  await mongoose.connect(uri, { bufferCommands: false });

  const businesses = mongoose.connection.collection("businesses");
  const reviews = mongoose.connection.collection("reviews");

  const all = await businesses.find({}, { projection: { _id: 1 } }).toArray();
  let updated = 0;

  for (const b of all) {
    const natives = await reviews
      .find({ businessId: b._id, source: "native" }, { projection: { rating: 1 } })
      .toArray();
    const count = natives.length;
    const sum = natives.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

    await businesses.updateOne(
      { _id: b._id },
      {
        $set: {
          googleRating: 0,
          googleRatingCount: 0,
          aggregateRating: avg,
          nativeRatingCount: count,
        },
      }
    );
    updated++;
  }

  console.log(`Cleared fake ratings on ${updated} businesses (real native reviews preserved).`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
