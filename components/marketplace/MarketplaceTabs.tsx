"use client";
import Link from "next/link";
import { ShoppingCart, Gift, Heart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/components/i18n/LanguageProvider";

interface Props { active: string; }

export function MarketplaceTabs({ active }: Props) {
  const { t } = useT();
  const tabs = [
    { href: "/buy-sell", label: t.marketplace.tabBuySell, icon: ShoppingCart },
    { href: "/adoption", label: t.common.categories.adoption, icon: Gift },
    { href: "/mating", label: t.common.categories.mating, icon: Heart },
    { href: "/lost-found", label: t.common.categories.lostFound, icon: MapPin },
  ];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((tab) => {
        const isActive = active === tab.href.slice(1);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border",
              isActive
                ? "bg-[#0E4A5C] text-white border-[#0E4A5C]"
                : "bg-white text-stone-600 border-stone-200 hover:border-[#0E4A5C]/50 hover:text-[#0E4A5C]"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
