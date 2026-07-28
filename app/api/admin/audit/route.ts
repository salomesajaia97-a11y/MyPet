import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AdminActionModel from "@/lib/models/AdminAction";
import { requireAdmin } from "@/lib/admin/guard";

const LIMIT = 300;

/** The admin audit trail, newest first. Read-only by design — a log that can be
 *  edited from the panel it audits is not a log. */
export async function GET(req: NextRequest) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const action = new URL(req.url).searchParams.get("action");
  const filter: Record<string, unknown> = {};
  // Prefix match so "review" covers review.hide, review.delete and the rest.
  if (action) filter.action = { $regex: `^${action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` };

  try {
    await connectDB();
    const entries = await AdminActionModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(LIMIT)
      .lean<
        {
          _id: { toString(): string };
          actorEmail?: string | null;
          action: string;
          targetType?: string | null;
          targetId?: string | null;
          summary?: string;
          createdAt: Date;
        }[]
      >();

    return NextResponse.json({
      entries: entries.map((e) => ({
        _id: e._id.toString(),
        actor: e.actorEmail ?? "—",
        action: e.action,
        targetType: e.targetType ?? null,
        targetId: e.targetId ?? null,
        summary: e.summary ?? "",
        createdAt: e.createdAt.toISOString(),
      })),
      truncated: entries.length === LIMIT,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
