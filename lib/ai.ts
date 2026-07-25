import { SPECIES, CITIES } from "@/lib/marketplace/filters";

// AI features are powered by OpenRouter (https://openrouter.ai), which exposes an
// OpenAI-compatible chat-completions API. We hit it with plain `fetch` so there's
// no SDK dependency and it runs on the default Node runtime. Two free Gemini
// models are used: a fast text model for query parsing and a vision model for
// lost-pet photo matching. The route checks `aiEnabled()` first and returns 503
// if the key is unset, so a missing key never throws at import time.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Free-only models (user constraint). The gemini-2.0 free preview IDs were
// retired (400 "not a valid model ID"); OpenRouter no longer offers any free
// Gemini tier. The free pool is heavily rate-limited (429/502) and small models
// vary in quality, so each task uses a FALLBACK CHAIN — the first model that
// returns usable content wins, otherwise we roll to the next. Ordered by
// Georgian/vision quality. Trade-off: under heavy free-pool throttling every
// model in a chain can 429 at once, in which case the route returns its 502.
//
// Text (Georgian → filters): Google Gemma reads the Georgian script well; the
// Nemotron 120B is a last-resort backup. (gpt-oss can't read Georgian; the
// "reasoning" free models burn the whole budget before emitting JSON.)
const SEARCH_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];
// Vision (pet photo comparison): the only free multimodal models available.
const MATCH_MODELS = [
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
];

export function aiEnabled(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: unknown;
}

// Try each model in `models` until one returns non-empty content. Free models
// frequently 429/502 or (for reasoning models) return empty content, so a
// failure on one is expected and we simply fall through to the next. Throws only
// when every model in the chain fails, so the caller can log and return a 502.
// No `response_format` is sent — several free providers reject it with a 400,
// and the callers already parse JSON defensively via extractJson().
async function openrouterChat(
  models: readonly string[],
  messages: ChatMessage[],
  maxTokens: number
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");

  let lastError = "no models tried";
  for (const model of models) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          // Optional attribution headers OpenRouter uses for its dashboard/rankings.
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://my-pet-self.vercel.app",
          "X-Title": "MyPet.ge",
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0 }),
      });

      if (!res.ok) {
        lastError = `${model} → HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`;
        continue;
      }
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        error?: { message?: string };
      };
      if (data.error) {
        lastError = `${model} → ${data.error.message ?? "error"}`;
        continue;
      }
      const content = data.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) return content;
      lastError = `${model} → empty content`;
    } catch (err) {
      lastError = `${model} → ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  throw new Error(`All free models failed. Last: ${lastError}`);
}

// Free models don't reliably honour strict json_schema, so we ask for JSON and
// parse defensively: strip any ```json fences, then take the outermost {...}.
function extractJson<T>(text: string): T | null {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(s.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

// ── Natural-language search parser ──────────────────────────────────────────

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

const SPECIES_SLUGS = SPECIES.map((s) => s.slug) as readonly string[];

const SYSTEM = `You convert a natural-language pet-marketplace search (usually Georgian, sometimes English) into structured filters for MyPet.ge.

Sections (field "type"):
- "buy-sell": buying/selling a pet (ყიდვა, გაყიდვა, ვყიდი, ვიყიდი).
- "adoption": giving away / adopting free (გაჩუქება, ჩუქდება, უფასოდ).
- "mating": breeding/mating (შეჯვარება).
- "lost-found": lost or found pets (დაკარგული, ნაპოვნი).
Leave "type" as "" if unclear.

Rules:
- species: one of dog, cat, bird, rabbit, reptile, other. "ძაღლი/puppy/dog"→dog, "კატა/cat"→cat. "" if none.
- city: EXACTLY one Georgian name from this allowed list, matching the user's city; else "". Allowed cities: ${CITIES.join(", ")}.
- minPrice/maxPrice: digits only (GEL). "under 500"→maxPrice "500"; "over 200"→minPrice "200". Else "".
- q: a breed keyword if named (e.g. "ლაბრადორი", "labrador"); else "".
- sex/status only when clearly implied; else "".

Respond with ONLY a JSON object, no prose, with exactly these string keys: type, species, city, sex, status, minPrice, maxPrice, q. Use "" for anything not specified.`;

// Coerce whatever the model returns into a valid, safe SearchFilters. Anything
// outside the allowed vocabulary collapses to "" so it can't inject a bad param.
function normalizeFilters(p: Record<string, unknown>): SearchFilters {
  const oneOf = <T extends string>(v: unknown, allowed: readonly string[]): T | "" =>
    typeof v === "string" && allowed.includes(v) ? (v as T) : "";
  // Free models often emit numeric fields as JSON numbers, not strings.
  const digits = (v: unknown) => {
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return String(Math.trunc(v));
    return typeof v === "string" && /^\d+$/.test(v) ? v : "";
  };
  return {
    type: oneOf(p.type, ["buy-sell", "adoption", "mating", "lost-found"]),
    species: oneOf(p.species, SPECIES_SLUGS),
    city: typeof p.city === "string" && (CITIES as readonly string[]).includes(p.city) ? p.city : "",
    sex: oneOf(p.sex, ["male", "female"]),
    status: oneOf(p.status, ["lost", "found"]),
    minPrice: digits(p.minPrice),
    maxPrice: digits(p.maxPrice),
    q: typeof p.q === "string" ? p.q.slice(0, 60) : "",
  };
}

export async function parseSearchQuery(query: string): Promise<SearchFilters | null> {
  const content = await openrouterChat(
    SEARCH_MODELS,
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: query },
    ],
    400
  );

  const parsed = extractJson<Record<string, unknown>>(content);
  if (!parsed) return null;
  return normalizeFilters(parsed);
}

// ── Lost-pet photo matcher ──────────────────────────────────────────────────

export interface MatchCandidate {
  id: string;
  imageUrl: string;
}

export interface MatchResult {
  id: string;
  score: number; // 0–100 likelihood it's the same individual animal
  confidence: "high" | "medium" | "low";
  reason: string; // short Georgian explanation
}

const MATCH_SYSTEM =
  "You are a careful pet-identification assistant for a lost & found board. You compare a QUERY photo against numbered candidate photos and report only genuine same-animal matches. Be conservative: a different-species, different-breed, or clearly different-coloured animal is NOT a match. Judge on coat colour, patterns/markings, breed, size, collar, and other distinctive features — not merely 'same breed'.";

const MATCH_INSTRUCTION = `Which candidates are likely the SAME individual animal as the QUERY pet?
Respond with ONLY a JSON object of the form:
{"matches":[{"index":<1-based candidate number>,"score":<0-100 integer, how likely SAME individual>,"reason":"<short Georgian explanation>"}]}
Only include candidates with a real visual resemblance (score >= 30). Sort most-confident first. If none match, return {"matches":[]}.`;

const scoreToConfidence = (score: number): "high" | "medium" | "low" =>
  score >= 75 ? "high" : score >= 45 ? "medium" : "low";

const clampScore = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
};

/**
 * Compare an uploaded pet photo (base64) against candidate listing photos and
 * return the likely same-animal matches, ranked by score. Candidates are
 * referenced back to their listing id via the returned 1-based index.
 */
export async function matchLostPet(
  queryBase64: string,
  queryMediaType: "image/jpeg" | "image/png" | "image/webp",
  candidates: MatchCandidate[]
): Promise<MatchResult[] | null> {
  if (candidates.length === 0) return [];

  // OpenAI-compatible multimodal content: text + image_url parts. The query
  // image is inlined as a data URL; candidates are passed by their public URL.
  const content: Array<
    { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
  > = [
    { type: "text", text: "QUERY pet (the animal to identify):" },
    { type: "image_url", image_url: { url: `data:${queryMediaType};base64,${queryBase64}` } },
  ];
  candidates.forEach((c, i) => {
    content.push({ type: "text", text: `Candidate ${i + 1}:` });
    content.push({ type: "image_url", image_url: { url: c.imageUrl } });
  });
  content.push({ type: "text", text: MATCH_INSTRUCTION });

  const out = await openrouterChat(
    MATCH_MODELS,
    [
      { role: "system", content: MATCH_SYSTEM },
      { role: "user", content },
    ],
    1200
  );

  const parsed = extractJson<{
    matches?: { index?: unknown; score?: unknown; reason?: unknown }[];
  }>(out);
  if (!parsed || !Array.isArray(parsed.matches)) return null;

  return parsed.matches
    .filter(
      (m) =>
        Number.isInteger(m.index) &&
        (m.index as number) >= 1 &&
        (m.index as number) <= candidates.length
    )
    .map((m) => {
      const score = clampScore(m.score);
      return {
        id: candidates[(m.index as number) - 1].id,
        score,
        confidence: scoreToConfidence(score),
        reason: typeof m.reason === "string" ? m.reason : "",
      };
    })
    .filter((m) => m.score >= 30)
    .sort((a, b) => b.score - a.score);
}
