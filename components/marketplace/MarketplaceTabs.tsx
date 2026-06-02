"use client";
import Link from "next/link";
import { ShoppingCart, Gift, Heart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { href: "/buy-sell", label: "ყიდვა/გაყიდვა", icon: ShoppingCart },
  { href: "/adoption", label: "გაჩუქება", icon: Gift },
  { href: "/mating", label: "შეჯვარება", icon: Heart },
  { href: "/lost-found", label: "დაკარგული/ნაპოვნი", icon: MapPin },
];

interface Props { active: string; }

export function MarketplaceTabs({ active }: Props) {
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
                ? "bg-[#6B5240] text-white border-[#6B5240]"
                : "bg-white text-stone-600 border-stone-200 hover:border-[#6B5240]/50 hover:text-[#6B5240]"
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
