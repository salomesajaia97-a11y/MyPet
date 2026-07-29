import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";
import { SITE_EMAIL } from "@/lib/seo/metadata";

// One icon, and it works. This row used to hold three: inert Telegram and
// Messenger placeholders for accounts that were never created, which read as a
// site whose social links are broken. Add them back when the accounts exist.

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
    { label: t.footer.faq, href: "/faq" },
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
              <Image src="/logo.png" alt="" width={36} height={36} className="w-9 h-9" />
              <span className="font-black text-lg tracking-tight">
                <span className="text-[#0E4A5C]">MyPet</span>
                <span className="text-stone-400 font-light">ge.online</span>
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
            <a
              href={`mailto:${SITE_EMAIL}`}
              aria-label={SITE_EMAIL}
              title={SITE_EMAIL}
              className="w-9 h-9 mt-3 flex items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:border-[#0E4A5C]/40 hover:text-[#0E4A5C] transition-colors"
            >
              <Mail className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </a>
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
