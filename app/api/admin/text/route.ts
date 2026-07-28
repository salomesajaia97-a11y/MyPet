import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteTextModel from "@/lib/models/SiteText";
import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { flattenDictionary } from "@/lib/i18n/overrides";
import { clearTextCache, getAllOverrides } from "@/lib/i18n/textStore";
import { logAdminAction, requireAdmin } from "@/lib/admin/guard";

const MAX_VALUE = 2000;

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * Every editable string, in both languages, with its default and its override.
 *
 * The defaults are computed from the compiled dictionaries rather than stored,
 * so a key added or renamed in code shows up here immediately and a stale
 * override simply has no row to attach to.
 */
export async function GET() {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const defaults = {
    ka: flattenDictionary(getDictionary("ka")),
    en: flattenDictionary(getDictionary("en")),
  };
  const overrides = await getAllOverrides();

  // Keys come from the Georgian dictionary: it defines the shape, and `en` is
  // typed to mirror it, so this list is the full set by construction.
  const keys = Object.keys(defaults.ka).sort();

  return NextResponse.json({
    items: keys.map((key) => ({
      key,
      ka: { value: overrides.ka[key] ?? defaults.ka[key], default: defaults.ka[key], overridden: key in overrides.ka },
      en: { value: overrides.en[key] ?? defaults.en[key] ?? "", default: defaults.en[key] ?? "", overridden: key in overrides.en },
    })),
  });
}

/** Save one string in one language. */
export async function PATCH(req: NextRequest) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { locale?: unknown; key?: unknown; value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isLocale(body.locale) || typeof body.key !== "string" || typeof body.value !== "string") {
    return NextResponse.json({ error: "locale, key and value are required" }, { status: 400 });
  }
  const value = body.value.slice(0, MAX_VALUE);
  // Blank would render as nothing, which reads as a broken page rather than an
  // edit. Resetting to the default is what DELETE is for.
  if (!value.trim()) {
    return NextResponse.json({ error: "Text cannot be empty — reset it instead" }, { status: 400 });
  }
  // Only keys that exist in the dictionary can be overridden; anything else is
  // a typo or a stale client, and storing it would leave a row nothing reads.
  const defaults = flattenDictionary(getDictionary(body.locale));
  if (!(body.key in defaults)) {
    return NextResponse.json({ error: "Unknown text key" }, { status: 400 });
  }

  try {
    await connectDB();
    await SiteTextModel.updateOne(
      { locale: body.locale, key: body.key },
      { $set: { value, updatedBy: actor.email ?? actor.id } },
      { upsert: true }
    );
    clearTextCache();
    await logAdminAction(actor, "text.update", {
      type: "text",
      id: `${body.locale}:${body.key}`,
      summary: `Changed ${body.key} (${body.locale})`,
    });
    return NextResponse.json({ ok: true, value });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Reset one string back to what the code ships, by removing its override. */
export async function DELETE(req: NextRequest) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale");
  const key = searchParams.get("key");
  if (!isLocale(locale) || !key) {
    return NextResponse.json({ error: "locale and key are required" }, { status: 400 });
  }

  try {
    await connectDB();
    await SiteTextModel.deleteOne({ locale, key });
    clearTextCache();
    await logAdminAction(actor, "text.reset", {
      type: "text",
      id: `${locale}:${key}`,
      summary: `Reset ${key} (${locale}) to the default`,
    });
    const defaults = flattenDictionary(getDictionary(locale));
    return NextResponse.json({ ok: true, value: defaults[key] ?? "" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
