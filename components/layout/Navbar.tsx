"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { PawPrint, Plus, Heart, LogIn, LogOut, Phone, Globe, ChevronUp, ChevronDown, List, Wallet, UserRound, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState, useRef, useEffect } from "react";
import { ImageUploader } from "@/components/ui/ImageUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SUB_NAV = [
  { href: "/buy-sell", label: "ყიდვა-გაყიდვა" },
  { href: "/adoption", label: "გაჩუქება" },
  { href: "/mating", label: "შეჯვარება" },
  { href: "/lost-found", label: "დაკარგული/ნაპოვნი" },
  { href: "/services/vet-clinics", label: "ვეტ-კლინიკები" },
  { href: "/services/pet-hotels", label: "სასტუმროები" },
  { href: "/services/pet-shops", label: "მაღაზიები" },
  { href: "/services/pet-friendly", label: "Pet-Friendly" },
];

const LANGUAGES = [
  { code: "ka", label: "ქართული" },
  { code: "en", label: "English" },
];

const CURRENCIES = [
  { code: "GEL", label: "GEL", symbol: "₾" },
  { code: "EUR", label: "EUR", symbol: "€" },
];

function LocaleSelector() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("ka");
  const [currency, setCurrency] = useState("GEL");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === lang)!;
  const currentCurrency = CURRENCIES.find((c) => c.code === currency)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="hidden sm:flex items-center gap-2 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 hover:border-stone-300 hover:bg-stone-50 transition-all font-medium"
      >
        <Globe className="w-4 h-4 text-stone-500" />
        <span>{currentLang.label}, {currentCurrency.symbol}</span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] bg-white border border-stone-200 rounded-2xl shadow-xl w-56 z-50 overflow-hidden">
          {/* Language section */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
              ენა
            </p>
            <div className="space-y-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-stone-50 transition-colors text-left"
                >
                  {/* Radio circle */}
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      lang === l.code
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-stone-300"
                    )}
                  >
                    {lang === l.code && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      lang === l.code ? "text-[#0F2830]" : "text-stone-600"
                    )}
                  >
                    {l.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-stone-100 mx-4" />

          {/* Currency section */}
          <div className="px-4 pt-3 pb-4">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
              ვალუტა
            </p>
            <div className="space-y-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-stone-50 transition-colors text-left"
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      currency === c.code
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-stone-300"
                    )}
                  >
                    {currency === c.code && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      currency === c.code ? "text-[#0F2830]" : "text-stone-600"
                    )}
                  >
                    {c.label} - {c.symbol}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ session }: { session: NonNullable<ReturnType<typeof useSession>["data"]> }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatar, setAvatar] = useState<string[]>(
    session.user?.image ? [session.user.image] : []
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleAvatarChange(urls: string[]) {
    setAvatar(urls);
    if (urls[0]) {
      await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urls[0] }),
      });
    }
  }

  const name = session.user?.name ?? "";
  const email = session.user?.email ?? "";
  const initial = (name || email).charAt(0).toUpperCase();
  const avatarUrl = avatar[0] ?? session.user?.image ?? null;

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 border rounded-full pl-1 pr-3 py-1 transition-all",
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
          <div className="absolute right-0 top-[calc(100%+6px)] bg-white border border-stone-200 rounded-2xl shadow-xl w-64 z-50 overflow-hidden">
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
                  Admin Panel
                </Link>
              )}
              {[
                { icon: List, label: "ჩემი განცხადებები", href: "/buy-sell" },
                { icon: Wallet, label: "ბალანსის შევსება", href: "#" },
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

              <button
                onClick={() => { setOpen(false); setProfileOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <UserRound className="w-4 h-4 text-stone-400 shrink-0" />
                პროფილი
              </button>

              <div className="h-px bg-stone-100 mx-4 my-1" />

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-stone-400 shrink-0" />
                გასვლა
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>პროფილის ფოტო</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <ImageUploader value={avatar} onChange={handleAvatarChange} single />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

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
          {/* Add listing */}
          <Link
            href="/listings/new"
            className="hidden sm:flex items-center gap-1.5 border border-[#0E4A5C] text-[#0E4A5C] hover:bg-[#0E4A5C] hover:text-white transition-all rounded-lg px-4 py-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            დამატება
          </Link>

          {/* Language / Currency selector */}
          <LocaleSelector />

          {/* Favorites */}
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-500">
            <Heart className="w-[18px] h-[18px]" />
          </button>

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
              <span>შესვლა</span>
            </Link>
          )}
        </div>
      </div>

      {/* Row 2 — sub-nav */}
      <div className="border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <nav className="flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SUB_NAV.map((item) => (
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
          <a
            href="tel:0322800015"
            className="hidden lg:flex items-center gap-1.5 text-xs text-stone-400 shrink-0 ml-4 pb-px hover:text-[#0E4A5C] transition-colors"
          >
            <Phone className="w-3 h-3" />
            032 2 80 00 15
          </a>
        </div>
      </div>
    </header>
  );
}
