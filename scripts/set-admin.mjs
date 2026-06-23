import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
const envVars = Object.fromEntries(
  envFile.split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const uri = envVars.MONGODB_URI;
if (!uri) { console.error("MONGODB_URI missing"); process.exit(1); }

const client = new MongoClient(uri);
await client.connect();
const db = client.db("mypet");
const result = await db.collection("users").findOneAndUpdate(
  { email: "salome.sajaia97@gmail.com" },
  { $set: { role: "admin" } },
  { returnDocument: "after" }
);
console.log(result ? `Done: ${result.email} is now ${result.role}` : "User not found");
await client.close();
