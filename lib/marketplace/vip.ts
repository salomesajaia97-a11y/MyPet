/**
 * A listing counts as VIP only when it has been paid-promoted (`isVip`) AND the
 * paid period has not lapsed. `vipUntil` null/absent means "no expiry" (e.g. an
 * admin-granted VIP); a past `vipUntil` means the promotion has expired and the
 * listing should drop out of the VIP section back into the normal feed.
 */
export function isVipActive(l: {
  isVip?: boolean;
  vipUntil?: string | Date | null;
}): boolean {
  if (!l.isVip) return false;
  if (!l.vipUntil) return true;
  return new Date(l.vipUntil).getTime() > Date.now();
}
