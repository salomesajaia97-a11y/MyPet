import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteSettingModel from "@/lib/models/SiteSetting";
import { clearSettingsCache, getSiteSettings } from "@/lib/settings";
import { VIP_TIERS, type VipTier } from "@/lib/marketplace/vipPackages";
import { logAdminAction, requireAdmin } from "@/lib/admin/guard";

export async function GET() {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Returns the merged view, so the form shows what is actually in force rather
  // than a set of blanks the admin has to guess the meaning of.
  return NextResponse.json(await getSiteSettings());
}

/**
 * Save prices, durations and feature switches.
 *
 * Amounts are validated here as well as merged defensively on read: a zero or
 * negative price would be a broken checkout, and the panel is the only thing
 * that writes this document.
 */
export async function PATCH(req: NextRequest) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { vip?: unknown; flags?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const vip: Record<string, { amount: number; days: number }> = {};
  const rawVip = (body.vip ?? {}) as Record<string, { amount?: unknown; days?: unknown }>;
  for (const tier of VIP_TIERS as readonly VipTier[]) {
    const entry = rawVip[tier];
    if (!entry) continue;
    const amount = Number(entry.amount);
    const days = Number(entry.days);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      return NextResponse.json({ error: `Invalid amount for ${tier}` }, { status: 400 });
    }
    if (!Number.isFinite(days) || days <= 0 || days > 3650) {
      return NextResponse.json({ error: `Invalid duration for ${tier}` }, { status: 400 });
    }
    vip[tier] = { amount: Math.round(amount), days: Math.round(days) };
  }

  const rawFlags = (body.flags ?? {}) as Record<string, unknown>;
  const flags = {
    aiSearch: rawFlags.aiSearch !== false,
    payments: rawFlags.payments !== false,
    registration: rawFlags.registration !== false,
  };

  try {
    await connectDB();
    await SiteSettingModel.updateOne(
      { key: "site" },
      { $set: { vip, flags, updatedBy: actor.email ?? actor.id } },
      { upsert: true }
    );
    clearSettingsCache();

    const off = Object.entries(flags)
      .filter(([, on]) => !on)
      .map(([name]) => name);
    await logAdminAction(actor, "settings.update", {
      type: "settings",
      id: "site",
      summary: off.length ? `Saved settings; disabled: ${off.join(", ")}` : "Saved settings",
    });

    return NextResponse.json(await getSiteSettings());
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
