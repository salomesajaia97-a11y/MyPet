"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ImageIcon, Store, ListChecks } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useT();

  const nav = [
    { href: "/admin", label: t.admin.nav.dashboard, icon: LayoutDashboard },
    { href: "/admin/listings", label: t.admin.nav.listings, icon: ListChecks },
    { href: "/admin/businesses", label: t.admin.nav.businesses, icon: Store },
    { href: "/admin/users", label: t.admin.nav.users, icon: Users },
    { href: "/admin/uploads", label: t.admin.nav.uploads, icon: ImageIcon },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col py-6 px-4 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6 px-2">
          {t.admin.title}
        </p>
        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 bg-gray-50 p-8 overflow-auto">{children}</main>
    </div>
  );
}
