# Getting MyPetge.online into Google (and the AI answer engines)

Everything on the code side is done: per-page metadata, canonical URLs, a
DB-driven `sitemap.xml`, `robots.txt` that explicitly allows the AI crawlers,
`llms.txt`, and JSON-LD on every page type. What code cannot do is prove to a
search engine that you own the domain, or hand Google a sitemap. That is this
runbook.

Canonical host is **https://www.mypetge.online** (the apex 308s to `www`).
Always register the `www` host, or use the Domain property (see below).

## 1. Google Search Console — verified

**Done.** The property is a **Domain** property for `mypetge.online`, verified by
DNS record at the registrar. That is the best of the available options: it covers
`www` and the apex, `http` and `https`, and it does not depend on anything the
app serves, so no deploy can break it.

No verification meta tag is needed, and `GOOGLE_SITE_VERIFICATION` is therefore
unset. `siteVerification()` in `lib/seo/metadata.ts` stays wired as a fallback in
case a second (URL-prefix) property is ever added — it emits nothing while the
variable is absent. Do not use the HTML-file method: that file lives outside the
app and does not survive a redeploy.

What is left in the Search Console UI, and only there:

- **Sitemaps** → submit `sitemap.xml`. Verification alone does not tell Google
  where the sitemap is; robots.txt points at it, but submitting it is what gets
  you the per-sitemap coverage report.
- **URL inspection** → homepage → *Request indexing*, then a couple of section
  pages (`/buy-sell`, `/services/vet-clinics`, `/faq`). Fastest first crawl a new
  site can get.
- **Pages** report, a few days later: read the excluded reasons. On this site the
  expected ones are "Alternate page with proper canonical tag" (paged feeds) and
  "Excluded by noindex" (`?q=` searches) — both deliberate. Anything else is a
  bug worth chasing.

## 2. Bing Webmaster Tools

https://www.bing.com/webmasters — you can import the property straight from
Search Console once step 1 is done. If you verify by meta tag instead, set
`BING_SITE_VERIFICATION` the same way as above (it ships as `msvalidate.01`).

Bing matters more than its search share suggests: **ChatGPT search and Copilot
read Bing's index**, so being in it is part of being cited by AI.

`YANDEX_VERIFICATION` is wired the same way if you want Yandex Webmaster —
worth it for Russian-language searches in Georgia.

## 3. IndexNow (already automatic)

`INDEXNOW_KEY` in the environment turns on instant submission: whenever a
listing is created, edited or deleted, or a business is approved, the URL is
pushed to IndexNow, which feeds Bing, Yandex and Seznam within minutes instead
of waiting for a crawl. See `lib/seo/indexNow.ts`. The key is served at
`/indexnow-key.txt`, which is how those engines confirm the submission is ours.

Google does not participate in IndexNow — for Google, the sitemap plus step 1 is
the route.

## 4. What is still worth doing (not code)

- **Google Business Profile** is not applicable (MyPetge.online is not a physical
  place), but the vet clinics and shops in the directory usually have one. A
  listed business linking back to its MyPetge.online page is the single strongest
  signal available to a young site.
- **Real social profiles.** `SITE_PROFILES` in `lib/seo/metadata.ts` is now
  empty and no `twitter:site` is emitted, because `t.me/mypetge` and `@mypetge`
  were never claimed and a `sameAs` pointing at nothing is a dead end for the
  knowledge graph. Register the accounts and add them back — a real, active
  profile is one of the few `sameAs` signals a young site can offer.
- **The contact email** is `mypetge.online@gmail.com` — the address that
  actually receives mail. A branded address on the site's own domain
  (`info@mypetge.online`) would read better and is worth setting up later, but a
  working Gmail beats a branded address nobody reads.
- **Answer real questions in text.** `/faq` exists and carries `FAQPage`
  structured data; adding to it is the cheapest way to rank for long-tail
  queries and to give an answer engine something quotable. Guides ("what a
  puppy costs in Tbilisi", "which vets are open at night") would do the same.

## 5. English is not indexable yet

The UI language is chosen by a cookie, so every URL serves Georgian to a
crawler. There is no `/en/...` URL for Google to index and no `hreflang` to
declare, which means English and Russian queries cannot reach the site through
search even though the whole UI is translated.

Fixing it means moving the locale into the URL (`/en/buy-sell` alongside
`/buy-sell`) and emitting `alternates.languages`. That is a routing change
across every route and a decision about which locale owns the bare path — worth
doing, but not a side effect of an SEO pass.
