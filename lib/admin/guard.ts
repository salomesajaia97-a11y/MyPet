import { auth } from "@/auth";
import AdminActionModel from "@/lib/models/AdminAction";

export type AdminActor = { id: string; email: string | null };

/**
 * Resolve the calling admin, or null.
 *
 * Every admin route had its own copy of this three-line check. One copy means
 * one place to change if the rule ever grows (a second role, a suspended
 * admin), and it hands back the actor so the caller can log the action instead
 * of resolving the session twice.
 */
export async function requireAdmin(): Promise<AdminActor | null> {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; email?: string } | undefined;
  if (!user?.id || user.role !== "admin") return null;
  return { id: user.id, email: user.email ?? null };
}

/**
 * Record an admin mutation. Never throws: a failed log must not turn a
 * successful moderation action into a 500, and the caller has already changed
 * the data by the time this runs.
 */
export async function logAdminAction(
  actor: AdminActor,
  action: string,
  target: { type?: string; id?: string; summary?: string } = {}
): Promise<void> {
  try {
    await AdminActionModel.create({
      actorId: actor.id,
      actorEmail: actor.email,
      action,
      targetType: target.type ?? null,
      targetId: target.id ?? null,
      summary: target.summary ?? "",
    });
  } catch (err) {
    console.error("[admin] audit write failed", err instanceof Error ? err.message : err);
  }
}
