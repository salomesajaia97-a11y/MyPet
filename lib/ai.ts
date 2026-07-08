import Anthropic from "@anthropic-ai/sdk";
import { SPECIES, CITIES } from "@/lib/marketplace/filters";

// Lazily construct the client so missing creds don't crash the module at
// import time — the route checks `aiEnabled()` first and returns 503 if unset.
// Accepts either an API key or an OAuth auth token; the SDK resolves whichever
// is present from the environment.
export function aiEnabled(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic(); // resolves ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN from env
  return client;
}

export interface SearchFilters {
  type: "" | "buy-sell" | "adoption" | "mating" | "lost-found";
  species: "" | "dog" | "cat" | "bird" | "rabbit" | "reptile" | "other";
  city: string; // one of CITIES, or ""
  sex: "" | "male" | "female";
  status: "" | "lost" | "found";
  minPrice: string; // digits or ""
  maxPrice: string; // digits or ""
  q: string; // breed keyword or ""
}

const SPECIES_SLUGS = SPECIES.map((s) => s.slug);

// JSON schema the model is constrained to. Empty string = "not specified" for
// every field (avoids nullable-enum complexity in structured outputs).
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["", "buy-sell", "adoption", "mating", "lost-found"] },
    species: { type: "string", enum: ["", ...SPECIES_SLUGS] },
    city: { type: "string", enum: ["", ...CITIES] },
    sex: { type: "string", enum: ["", "male", "female"] },
    status: { type: "string", enum: ["", "lost", "found"] },
    minPrice: { type: "string" },
    maxPrice: { type: "string" },
    q: { type: "string" },
  },
  required: ["type", "species", "city", "sex", "status", "minPrice", "maxPrice", "q"],
} as const;

const SYSTEM = `You convert a natural-language pet-marketplace search (usually Georgian, sometimes English) into structured filters for MyPet.ge.

Sections (field "type"):
- "buy-sell": buying/selling a pet (ყიდვა, გაყიდვა, ვყიდი, ვიყიდი).
- "adoption": giving away / adopting free (გაჩუქება, ჩუქდება, უფასოდ).
- "mating": breeding/mating (შეჯვარება).
- "lost-found": lost or found pets (დაკარგული, ნაპოვნი).
Leave "type" as "" if unclear.

Rules:
- species: map to one of dog, cat, bird, rabbit, reptile, other. "ძაღლი/puppy/dog"→dog, "კატა/cat"→cat. "" if none.
- city: only a value from the allowed list, matching the user's city; else "".
- minPrice/maxPrice: digits only (GEL). "under 500"→maxPrice "500"; "over 200"→minPrice "200". Else "".
- q: a breed keyword if named (e.g. "ლაბრადორი", "labrador"); else "".
- sex/status only when clearly implied; else "".
Return every field; use "" for anything not specified.`;

export async function parseSearchQuery(query: string): Promise<SearchFilters | null> {
  const res = await getClient().messages.create({
    model: "claude-opus-4-8",
    max_tokens: 400,
    thinking: { type: "disabled" },
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: query }],
  });

  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;
  try {
    return JSON.parse(text.text) as SearchFilters;
  } catch {
    return null;
  }
}

// ── Lost-pet photo matcher ──────────────────────────────────────────────────

export interface MatchCandidate {
  id: string;
  imageUrl: string;
}

export interface MatchResult {
  id: string;
  confidence: "high" | "medium" | "low";
  reason: string;
}

const MATCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    matches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: { type: "integer" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          reason: { type: "string" },
        },
        required: ["index", "confidence", "reason"],
      },
    },
  },
  required: ["matches"],
} as const;

/**
 * Compare an uploaded pet photo (base64) against candidate listing photos and
 * return the likely same-animal matches, ranked by confidence. Candidates are
 * referenced back to their listing id via the returned index.
 */
export async function matchLostPet(
  queryBase64: string,
  queryMediaType: "image/jpeg" | "image/png" | "image/webp",
  candidates: MatchCandidate[]
): Promise<MatchResult[] | null> {
  if (candidates.length === 0) return [];

  const content: Anthropic.ContentBlockParam[] = [
    { type: "text", text: "QUERY pet (the animal to identify):" },
    { type: "image", source: { type: "base64", media_type: queryMediaType, data: queryBase64 } },
  ];
  candidates.forEach((c, i) => {
    content.push({ type: "text", text: `Candidate ${i + 1}:` });
    content.push({ type: "image", source: { type: "url", url: c.imageUrl } });
  });
  content.push({
    type: "text",
    text: `Which candidates are likely the SAME individual animal as the QUERY pet? Compare species, breed, size, coloring, and distinctive markings — not just "same breed". Only include a candidate if there is a real visual resemblance. Return matches sorted most-confident first, with the candidate's number as "index" (1-based) and a short Georgian "reason".`,
  });

  const res = await getClient().messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1000,
    thinking: { type: "disabled" },
    output_config: { effort: "low", format: { type: "json_schema", schema: MATCH_SCHEMA } },
    system:
      "You are a careful pet-identification assistant for a lost & found board. You compare a query photo against candidate photos and report only genuine same-animal matches. Be conservative: a different-colored or different-breed animal is not a match.",
    messages: [{ role: "user", content }],
  });

  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return null;
  try {
    const parsed = JSON.parse(text.text) as {
      matches: { index: number; confidence: "high" | "medium" | "low"; reason: string }[];
    };
    return parsed.matches
      .filter((m) => m.index >= 1 && m.index <= candidates.length)
      .map((m) => ({ id: candidates[m.index - 1].id, confidence: m.confidence, reason: m.reason }));
  } catch {
    return null;
  }
}
