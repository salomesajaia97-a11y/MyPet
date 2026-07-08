"use client";
import Link from "next/link";
import { Stethoscope, Building2, ShoppingBag, Coffee } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/components/i18n/LanguageProvider";

interface Props { active: string; }

export function ServicesTabs({ active }: Props) {
  const { t } = useT();
  const tabs = [
    { key: "vet-clinics", href: "/services/vet-clinics", label: t.services.tabs.vetClinics, icon: Stethoscope },
    { key: "pet-hotels", href: "/services/pet-hotels", label: t.services.tabs.petHotels, icon: Building2 },
    { key: "pet-shops", href: "/services/pet-shops", label: t.services.tabs.petShops, icon: ShoppingBag },
    { key: "pet-friendly", href: "/services/pet-friendly", label: t.services.tabs.petFriendly, icon: Coffee },
  ];
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
