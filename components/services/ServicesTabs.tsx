"use client";
import Link from "next/link";
import { Stethoscope, Building2, ShoppingBag, Coffee } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { key: "vet-clinics", href: "/services/vet-clinics", label: "ვეტკლინიკები", icon: Stethoscope },
  { key: "pet-hotels", href: "/services/pet-hotels", label: "სასტუმროები", icon: Building2 },
  { key: "pet-shops", href: "/services/pet-shops", label: "მაღაზიები", icon: ShoppingBag },
  { key: "pet-friendly", href: "/services/pet-friendly", label: "ფეთ-ფრენდლი", icon: Coffee },
];

interface Props { active: string; }

export function ServicesTabs({ active }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border",
            active === tab.key
              ? "bg-[#0E4A5C] text-white border-[#0E4A5C]"
              : "bg-white text-stone-600 border-stone-200 hover:border-[#0E4A5C]/50 hover:text-[#0E4A5C]"
          )}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
