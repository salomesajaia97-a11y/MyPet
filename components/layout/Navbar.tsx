"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PawPrint, Store, Briefcase, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "მთავარი", icon: Home, exact: true },
  { href: "/buy-sell", label: "ბაზარი", icon: Store, exact: false, matchPrefix: ["/buy-sell", "/adoption", "/mating", "/lost-found"] },
  { href: "/services", label: "სერვისები", icon: Briefcase, exact: false, matchPrefix: ["/services"] },
];

export function Navbar() {
  const pathname = usePathname();

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return pathname === item.href;
    if (item.matchPrefix) return item.matchPrefix.some(p => pathname.startsWith(p));
    return pathname.startsWith(item.href);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#6B5240] flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-[#1C1917] tracking-tight">MyPet</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[#6B5240] text-white"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
