import Link from "next/link";
import { PawPrint, Send, MessageCircle, Mail } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";

// No real social accounts yet — render as inert placeholders (not `href="#"`
// links that jump to the top of the page). Swap in real URLs when available.
const SOCIALS = [
  { label: "Telegram", Icon: Send },
  { label: "Messenger", Icon: MessageCircle },
  { label: "Email", Icon: Mail },
];

export async function Footer() {
  const { t } = await getServerDictionary();

  // Sitemap-style quick links reuse the marketplace + services routes so the
  // footer stays in step with the sub-nav.
  const NAV_LINKS = [
    { label: t.common.categories.buySell, href: "/buy-sell" },
    { label: t.common.categories.adoption, href: "/adoption" },
    { label: t.common.categories.mating, href: "/mating" },
    { label: t.common.categories.lostFound, href: "/lost-found" },
    { label: t.common.categories.vetClinics, href: "/services/vet-clinics" },
    { label: t.common.categories.petHotels, href: "/services/pet-hotels" },
  ];

  // Core info + legal pages.
  const LEGAL_LINKS = [
    { label: t.footer.about, href: "/about" },
    { label: t.footer.contact, href: "/contact" },
    { label: t.footer.terms, href: "/terms" },
    { label: t.footer.privacy, href: "/privacy" },
  ];

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
              {t.common.tagline}
            </p>
          </div>

          {/* Quick links */}
          <nav className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
              {t.footer.listingsHeading}
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
              {t.footer.infoHeading}
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
              {SOCIALS.map(({ label, Icon }) => (
                <span
                  key={label}
                  aria-label={label}
                  title={label}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-stone-200 text-stone-400"
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-200">
          <p className="text-xs text-stone-400 text-center">
            {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
