"use client";

import { useEffect, useState } from "react";
import { VIP_PACKAGES, type VipPackage, type VipTier } from "@/lib/marketplace/vipPackages";

/**
 * Live package table for client components.
 *
 * Starts from the compiled-in defaults so a card never renders blank, then
 * swaps in whatever the panel currently has. Nothing here is authoritative:
 * the checkout route looks the price up again server-side, so a stale render
 * cannot affect what a customer is charged.
 */
export function useVipPackages(): {
  packages: Record<VipTier, VipPackage>;
  paymentsEnabled: boolean;
} {
  const [state, setState] = useState<{
    packages: Record<VipTier, VipPackage>;
    paymentsEnabled: boolean;
  }>({ packages: VIP_PACKAGES, paymentsEnabled: true });

  useEffect(() => {
    let active = true;
    fetch("/api/vip/packages")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d?.packages) return;
        setState({ packages: d.packages, paymentsEnabled: d.paymentsEnabled !== false });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return state;
}
