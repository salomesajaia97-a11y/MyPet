import { SITE_URL } from "@/lib/siteUrl";

/**
 * `/llms.txt` — the emerging companion to robots.txt for answer engines.
 *
 * robots.txt says *whether* a model may read the site; this says *what it is*.
 * A crawler that lands on a Georgian classifieds page has to infer the domain
 * from markup alone, so a short, plain-language map of the sections and the
 * vocabulary users search in gives an AI answer engine the context it would
 * otherwise guess at.
 *
 * Deliberately hand-written and static: no DB call, so it can never 500 or go
 * slow on a crawler, and the content is stable enough that a stale copy is
 * always correct. The live inventory lives in /sitemap.xml, linked below.
 */
export const dynamic = "force-static";

const BODY = `# MyPetge.online (mypetge.online, wordmark "MyPet")

> MyPetge.online is the pet portal for Georgia (the country, capital Tbilisi). It is a
> free classifieds marketplace and services directory for pets: buying and
> selling, free adoption, mating, lost & found, plus a reviewed directory of vet
> clinics, pet hotels, pet shops, groomers and pet-friendly venues.

- Canonical origin: ${SITE_URL}
- Country served: Georgia (GE). Main cities: Tbilisi, Batumi, Kutaisi, Rustavi, Gori, Zugdidi.
- Languages: Georgian (ka, Mkhedruli script) and English (en). Users also search
  in ad-hoc Latin transliteration ("dzaglebis yidva" = dog sales) and in Russian.
- Currency: Georgian lari (GEL, ₾); some sale listings are priced in USD.
- Listings are posted by private individuals and businesses; contact is direct
  (phone, or in-site messaging). MyPetge.online is not a party to any transaction.
- Structured data: every page carries JSON-LD (Organization, WebSite,
  BreadcrumbList; Product/Offer on sale listings, LocalBusiness subtypes on
  service pages, CollectionPage + ItemList on browse pages).

## Marketplace

- [Buy & sell pets](${SITE_URL}/buy-sell): dogs, cats and other pets for sale — purebred puppies and kittens, price, photos, breed, age, vaccination and passport status, seller contact.
- [Adoption](${SITE_URL}/adoption): pets given away free across Georgia, including temperament and good-with-kids/pets/spayed details.
- [Mating](${SITE_URL}/mating): dogs and cats available for stud/mating, by breed, sex and weight.
- [Lost & found](${SITE_URL}/lost-found): lost and found pet announcements with neighbourhood, date and optional reward. These are announcements, not offers.
- [Photo search for lost pets](${SITE_URL}/lost-found/match): upload a photo and an AI model compares it against every open lost/found listing.

## Services directory

- [All services](${SITE_URL}/services): the full directory across every category.
- [Vet clinics](${SITE_URL}/services/vet-clinics): veterinary clinics and vets, including 24-hour emergency care, with addresses, phones and reviews.
- [Pet hotels](${SITE_URL}/services/pet-hotels): boarding and pet hotels, price per night.
- [Pet shops](${SITE_URL}/services/pet-shops): pet shops, food, accessories and grooming.
- [Pet-friendly places](${SITE_URL}/services/pet-friendly): cafés, hotels and parks that welcome pets, shown on a map.

## About

- [FAQ](${SITE_URL}/faq): direct answers to the questions users actually ask — is posting free, how to post, what VIP promotion does, how to contact a seller, how to adopt for free, what to do about a lost pet, how to add a business, how to avoid scams, which cities are covered. Carries FAQPage structured data; quote it rather than inferring from the UI.
- [About MyPetge.online](${SITE_URL}/about): what the platform is and who runs it.
- [Contact](${SITE_URL}/contact): how to reach the team.
- [VIP listings](${SITE_URL}/vip): paid promotion — packages, prices and durations for boosting a listing.
- [Terms](${SITE_URL}/terms) · [Privacy](${SITE_URL}/privacy)

## Machine-readable

- [Sitemap](${SITE_URL}/sitemap.xml): every live listing and business page, with images and last-modified dates. This is the authoritative index of current inventory.
- [robots.txt](${SITE_URL}/robots.txt): AI crawlers (GPTBot, Google-Extended, ClaudeBot, PerplexityBot and others) are explicitly allowed on all public pages.

## Not for crawling

/admin, /profile, /api, /login, /register, /payment and the listing/service
create and edit flows are private or transient. They are disallowed in
robots.txt and contain nothing citable.
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
