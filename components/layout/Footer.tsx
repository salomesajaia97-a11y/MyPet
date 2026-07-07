import Link from "next/link";
import { PawPrint, Send, MessageCircle, Mail } from "lucide-react";

// Sitemap-style quick links reuse the marketplace + services routes so the
// footer stays in step with the sub-nav.
const NAV_LINKS = [
  { label: "ყიდვა-გაყიდვა", href: "/buy-sell" },
  { label: "გაჩუქება", href: "/adoption" },
  { label: "შეჯვარება", href: "/mating" },
  { label: "დაკარგული/ნაპოვნი", href: "/lost-found" },
  { label: "ვეტ-კლინიკები", href: "/services/vet-clinics" },
  { label: "სასტუმროები", href: "/services/pet-hotels" },
];

// Core info + legal pages.
const LEGAL_LINKS = [
  { label: "ჩვენს შესახებ", href: "/about" },
  { label: "კონტაქტი", href: "/contact" },
  { label: "წესები და პირობები", href: "/terms" },
  { label: "კონფიდენციალურობა", href: "/privacy" },
];

const SOCIALS = [
  { label: "Telegram", href: "#", Icon: Send },
  { label: "Messenger", href: "#", Icon: MessageCircle },
  { label: "Email", href: "#", Icon: Mail },
];

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-[#F7FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#0E4A5C] flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-lg tracking-tight">
                <span className="text-[#0E4A5C]">MyPet</span>
                <span className="text-stone-400 font-light">.ge</span>
              </span>
            </Link>
            <p className="text-sm text-stone-500 mt-3 leading-relaxed">
              ყიდვა, გაჩუქება და სერვისები — ერთ სივრცეში
            </p>
          </div>

          {/* Quick links */}
          <nav className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
              განცხადებები
            </p>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm text-stone-600 hover:text-[#0E4A5C] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Legal + social */}
          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
              ინფორმაცია
            </p>
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm text-stone-600 hover:text-[#0E4A5C] transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 mt-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:border-[#0E4A5C]/40 hover:text-[#0E4A5C] transition-colors"
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-200">
          <p className="text-xs text-stone-400 text-center">
            © 2026 MyPet.ge — ყველა უფლება დაცულია
          </p>
        </div>
      </div>
    </footer>
  );
}
