import { NextResponse } from "next/server";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";

interface MongooseValidationError {
  name: string;
  errors?: Record<string, { message?: string }>;
}

/**
 * Map a thrown error from a Mongoose write into a clean JSON response.
 *
 * - schema `ValidationError` → 400 with the field messages (never the raw
 *   internal string, and never a 500 for what is really bad client input)
 * - duplicate key (E11000) → 409
 * - anything else → logged server-side, generic 500
 */
export async function handleMutationError(
  err: unknown,
  context: string,
  validationFallback?: string
) {
  const fallback =
    validationFallback ?? getDictionary(await getServerLocale()).misc.validationFailed;
  if (err && typeof err === "object") {
    const e = err as MongooseValidationError & { code?: number };
    if (e.name === "ValidationError") {
      const message =
        Object.values(e.errors ?? {})
          .map((f) => f?.message)
          .filter(Boolean)
          .join(", ") || fallback;
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (e.code === 11000) {
      return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
    }
  }
  console.error(`[${context}]`, err instanceof Error ? err.message : err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
