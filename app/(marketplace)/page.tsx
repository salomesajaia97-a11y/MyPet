import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { ShoppingCart, Heart, Shuffle, AlertCircle } from "lucide-react";

const tabs = [
  { href: "/buy-sell", label: "Buy / Sell", georgian: "ყიდვა/გაყიდვა", icon: ShoppingCart, color: "text-cream-700" },
  { href: "/adoption", label: "Adoption", georgian: "გაჩუქება", icon: Heart, color: "text-emerald-700" },
  { href: "/mating", label: "Mating", georgian: "შეჯვარება", icon: Shuffle, color: "text-violet-700" },
  { href: "/lost-found", label: "Lost & Found", georgian: "დაკარგული", icon: AlertCircle, color: "text-red-700" },
];

export default function MarketplacePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Pet Marketplace</h1>
        <p className="text-muted-foreground text-lg">Georgia&apos;s most trusted platform for pets</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="group block">
            <div className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <tab.icon className={cn("w-10 h-10 mx-auto mb-4", tab.color)} />
              <p className="font-bold text-lg">{tab.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{tab.georgian}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
