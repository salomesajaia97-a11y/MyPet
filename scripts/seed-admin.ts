import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const ADMIN_EMAIL = "salome.sajaia97@gmail.com";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, lowercase: true, trim: true },
    passwordHash: String,
    image: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set in .env.local");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const User = mongoose.models.User ?? mongoose.model("User", UserSchema);

  const result = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { $set: { role: "admin" } },
    { new: true }
  );

  if (!result) {
    console.error(`User ${ADMIN_EMAIL} not found — register first, then run this script.`);
    process.exit(1);
  }

  console.log(`Done — ${result.email} is now admin.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
