"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { PawPrint, Plus, Heart, LogIn, LogOut, Phone, ChevronDown, List, Wallet, UserRound, ShieldCheck, MessageCircle, Bell, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState, useRef, useEffect } from "react";
import PhoneLink from "@/components/ui/PhoneLink";
import { useT } from "@/components/i18n/LanguageProvider";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";

function useSubNav() {
  const { t } = useT();
  const c = t.common.categories;
  return [
    { href: "/buy-sell", label: c.buySell },
    { href: "/adoption", label: c.adoption },
    { href: "/mating", label: c.mating },
    { href: "/lost-found", label: c.lostFound },
    { href: "/services/vet-clinics", label: c.vetClinics },
    { href: "/services/pet-hotels", label: c.petHotels },
    { href: "/services/pet-shops", label: c.petShops },
    { href: "/services/pet-friendly", label: c.petFriendly },
  ];
}

function MessagesLink() {
  const { status } = useSession();
  const { t } = useT();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    const load = () =>
      fetch("/api/messages/unread-count")
        .then((r) => (r.ok ? r.json() : { count: 0 }))
        .then((d) => {
          if (active) setCount(d.count ?? 0);
        })
        .catch(() => {});
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [status]);

  return (
    <Link
      href="/profile/messages"
      aria-label={t.nav.messages}
      className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-500"
    >
      <MessageCircle className="w-[18px] h-[18px]" />
      {count > 0 && (
        <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function NotificationsBell() {
  const { status } = useSession();
  const { t } = useT();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    const load = () =>
      fetch("/api/profile/notifications/unread-count")
        .then((r) => (r.ok ? r.json() : { count: 0 }))
        .then((d) => {
          if (active) setCount(d.count ?? 0);
        })
        .catch(() => {});
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [status]);

  return (
    <Link
      href="/profile/notifications"
      aria-label={t.nav.notifications}
      className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-500"
    >
      <Bell className="w-[18px] h-[18px]" />
      {count > 0 && (
        <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function UserMenu({ session }: { session: NonNullable<ReturnType<typeof useSession>["data"]> }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const name = session.user?.name ?? "";
  const email = session.user?.email ?? "";
  const initial = (name || email).charAt(0).toUpperCase();
  const avatarUrl = session.user?.image ?? null;

  return (
    <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t.nav.userMenu}
          className={cn(
            "flex items-center gap-2 border rounded-full pl-1 pr-3 py-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4A5C]/40",
            open ? "border-stone-300 bg-stone-50" : "border-stone-200 hover:border-stone-300"
          )}
        >
          <div className="w-7 h-7 rounded-full bg-[#0E4A5C] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : initial}
          </div>
          <span className="text-sm font-medium text-stone-700 max-w-[60px] truncate hidden sm:block">
            {name || email.split("@")[0]}
          </span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-stone-400 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div role="menu" className="absolute right-0 top-[calc(100%+6px)] bg-white border border-stone-200 rounded-2xl shadow-xl w-64 z-50 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-stone-100">
              <div className="w-10 h-10 rounded-full bg-[#0E4A5C] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0F2830] truncate">{email}</p>
              </div>
            </div>

            <div className="py-2">
              {(session.user as { role?: string })?.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  {t.nav.adminPanel}
                </Link>
              )}
              {[
                { icon: List, label: t.nav.myListings, href: "/profile/listings" },
                { icon: Wallet, label: t.nav.topUpBalance, href: "/profile/balance" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <item.icon className="w-4 h-4 text-stone-400 shrink-0" />
                  {item.label}
                </Link>
              ))}

              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <UserRound className="w-4 h-4 text-stone-400 shrink-0" />
                {t.nav.profile}
              </Link>

              <div className="h-px bg-stone-100 mx-4 my-1" />

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-stone-400 shrink-0" />
                {t.nav.signOut}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { t } = useT();
  const subNav = useSubNav();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Collapse the mobile menu whenever navigation lands on a new route.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-stone-200">
      {/* Row 1 — main bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#0E4A5C] flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight">
            <span className="text-[#0E4A5C]">MyPet</span>
            <span className="text-stone-400 font-light">.ge</span>
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Add listing — visible on mobile too (icon-only on the smallest screens) */}
          <Link
            href="/listings/new"
            className="flex items-center gap-1.5 border border-[#0E4A5C] text-[#0E4A5C] hover:bg-[#0E4A5C] hover:text-white transition-all rounded-lg px-3 sm:px-4 py-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.nav.addListing}</span>
          </Link>

          {/* Language switch */}
          <LanguageToggle />

          {/* Messages */}
          <MessagesLink />

          {/* Notifications */}
          {status === "authenticated" && <NotificationsBell />}

          {/* Favorites */}
          <Link
            href="/profile/favorites"
            aria-label={t.nav.favorites}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-500"
          >
            <Heart className="w-[18px] h-[18px]" />
          </Link>

          {/* Auth */}
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-stone-100 animate-pulse" />
          ) : session ? (
            <UserMenu session={session} />
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-[#0E4A5C] transition-colors px-3 py-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.nav.signIn}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Row 2 — sub-nav */}
      <div className="border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Desktop: full inline sub-nav */}
          <nav className="hidden lg:flex items-center">
            {subNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors",
                  isActive(item.href)
                    ? "border-[#0E4A5C] text-[#0E4A5C]"
                    : "border-transparent text-stone-500 hover:text-[#0E4A5C] hover:border-stone-300"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile: hamburger toggle instead of the overflowing nav */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={t.nav.menu}
            className="lg:hidden flex items-center gap-2 py-2.5 text-[13px] font-semibold text-stone-600 hover:text-[#0E4A5C] transition-colors"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {t.nav.menu}
          </button>

          <PhoneLink
            phone="+995 551 08 09 60"
            className="hidden lg:flex items-center gap-1.5 text-xs text-stone-400 shrink-0 ml-4 pb-px hover:text-[#0E4A5C] transition-colors"
          >
            <Phone className="w-3 h-3" />
            551 08 09 60
          </PhoneLink>
        </div>

        {/* Mobile: collapsible panel */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-stone-100 bg-white shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-col">
              {subNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "py-2.5 text-sm font-medium border-b border-stone-100 last:border-b-0 transition-colors",
                    isActive(item.href)
                      ? "text-[#0E4A5C]"
                      : "text-stone-600 hover:text-[#0E4A5C]"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <PhoneLink
                phone="+995 551 08 09 60"
                className="flex items-center gap-1.5 py-2.5 text-sm text-stone-500 hover:text-[#0E4A5C] transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                551 08 09 60
              </PhoneLink>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
