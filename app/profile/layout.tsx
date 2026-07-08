"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound, List, Heart, MessageCircle, Wallet, Briefcase, Bell } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/components/i18n/LanguageProvider";

const TABS = [
  { href: "/profile", key: "profile", icon: UserRound, exact: true },
  { href: "/profile/listings", key: "listings", icon: List, exact: false },
  { href: "/profile/businesses", key: "businesses", icon: Briefcase, exact: false },
  { href: "/profile/notifications", key: "notifications", icon: Bell, exact: false },
  { href: "/profile/favorites", key: "favorites", icon: Heart, exact: false },
  { href: "/profile/messages", key: "messages", icon: MessageCircle, exact: false },
  { href: "/profile/balance", key: "balance", icon: Wallet, exact: false },
] as const;

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const pathname = usePathname();

  return (
    <>
      <nav
        aria-label={t.profile.nav.aria}
        className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-stone-200"
      >
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap px-3 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4A5C]/40 rounded-t",
                  active
                    ? "border-[#0E4A5C] text-[#0E4A5C]"
                    : "border-transparent text-stone-500 hover:text-[#0E4A5C]"
                )}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {t.profile.nav[tab.key]}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </>
  );
}
