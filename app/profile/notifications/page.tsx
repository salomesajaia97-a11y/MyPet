"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

interface Notification {
  _id: string;
  type: "business_approved";
  businessName?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { t, locale } = useT();
  const router = useRouter();
  const { status } = useSession();
  const [items, setItems] = useState<Notification[] | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res = await fetch("/api/profile/notifications", { cache: "no-store" });
        const { notifications } = await res.json();
        setItems(notifications ?? []);
        // Opening the page clears the unread state.
        if ((notifications ?? []).some((n: Notification) => !n.read)) {
          fetch("/api/profile/notifications", { method: "PATCH" }).catch(() => {});
        }
      } catch {
        setItems([]);
      }
    })();
  }, [status]);

  function title(n: Notification): string {
    if (n.type === "business_approved") return t.profile.notifications.businessApproved.title;
    return "";
  }
  function body(n: Notification): string {
    if (n.type === "business_approved") {
      return t.profile.notifications.businessApproved.body.replace(
        "{name}",
        n.businessName ?? ""
      );
    }
    return "";
  }
  function when(iso: string): string {
    return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "ka-GE", {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#0F2830] mb-6 flex items-center gap-2">
          <Bell className="w-6 h-6 text-[#0E4A5C]" />
          {t.profile.notifications.title}
        </h1>

        {items === null ? (
          <p className="text-stone-400 text-sm text-center py-10">{t.profile.notifications.loading}</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center space-y-3">
            <div className="text-4xl">🔔</div>
            <p className="text-stone-500 text-sm">{t.profile.notifications.empty}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => {
              const card = (
                <div
                  className={
                    "flex items-start gap-3 rounded-2xl shadow-sm p-4 transition-shadow " +
                    (n.read ? "bg-white" : "bg-[#0E4A5C]/5 border border-[#0E4A5C]/15")
                  }
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[#0F2830]">{title(n)}</p>
                      <span className="text-xs text-stone-400 shrink-0">{when(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed">{body(n)}</p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0E4A5C]" />
                  )}
                </div>
              );
              return n.link ? (
                <Link key={n._id} href={n.link} className="block">
                  {card}
                </Link>
              ) : (
                <div key={n._id}>{card}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
