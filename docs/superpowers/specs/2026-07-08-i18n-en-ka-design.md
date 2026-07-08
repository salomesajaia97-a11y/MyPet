# Design: Bilingual UI (English / Georgian) with cookie-based language switch

Date: 2026-07-08
Status: Approved (design), pending implementation plan

## Goal

Let users switch the app UI between **Georgian (KA)** and **English (EN)** via a
toggle in the navbar. When English is selected, every piece of fixed application
text — navbar, sub-nav, buttons, form fields, labels, page headings, footer,
error and empty states, admin panel — renders in English. The chosen language
persists across pages and visits.

## Scope

**In scope — UI chrome only:**
- All hardcoded interface strings currently written in Georgian
  (~719 occurrences across 64 `.ts`/`.tsx` files).
- Enum / label maps that drive UI text:
  [lib/marketplace/filters.ts](../../../lib/marketplace/filters.ts),
  [lib/marketplace/format.ts](../../../lib/marketplace/format.ts).
- `<html lang>` attribute reflects the active locale.
- Skip-to-content link, `aria-label`s, `alt` text, `Metadata` title/description.

**Out of scope:**
- User-generated content (listings, messages, reviews written by users) — stays
  in whatever language the author typed.
- Proper-noun seed data in
  [lib/data/businesses.ts](../../../lib/data/businesses.ts) — real business
  names / addresses are left as-is (confirmed by user).
- No machine translation, no URL locale prefix, no third-party i18n library.

## Locale model

- Two locales: `"ka"` (default) and `"en"`.
- **Source of truth: a cookie** named `locale`, value `ka` | `en`.
- No URL change — routes stay `/buy-sell`, `/services/...`, etc. (avoids
  restructuring 60+ routes under `[locale]`).

## Architecture

The app mixes Server Components (25 files with text) and Client Components
(38 files with text). Both must render from the same locale, so the design
serves each render world from the one cookie.

### New module: `lib/i18n/`

```
lib/i18n/
  index.ts                 # Locale type, defaultLocale, getDictionary(), getServerLocale()
  dictionaries/ka.ts       # Georgian strings, namespaced
  dictionaries/en.ts       # English mirror — identical key shape
```

- `Locale = "ka" | "en"`, `defaultLocale = "ka"`, `locales = ["ka","en"]`.
- Dictionaries are plain nested objects keyed by namespace:
  `nav`, `footer`, `auth`, `marketplace`, `listings`, `services`, `profile`,
  `admin`, `reviews`, `common`, `errors`.
- `getDictionary(locale)` returns the typed dictionary object.
- `getServerLocale()` reads the `locale` cookie via `cookies()` from
  `next/headers`, falls back to `defaultLocale`. Server-only.
- `en.ts` is typed as `typeof ka` so a missing/renamed key is a compile error —
  keeps the two dictionaries in lockstep.

### Server Components

Read locale directly, no context:

```ts
import { getServerLocale, getDictionary } from "@/lib/i18n";
const t = getDictionary(getServerLocale());
// ...t.footer.about
```

Reading the cookie makes these components dynamic per request. Acceptable — the
app is already dynamic (auth session + MongoDB on most pages).

### Client Components

`components/i18n/LanguageProvider.tsx` (client):
- React context holding `{ locale, dict }`.
- Seeded with the initial locale read server-side in `app/layout.tsx` and passed
  as a prop — no hydration mismatch.
- Exposes `useT()` → `{ t, locale, setLocale }` where `t` indexes the dict
  (e.g. `t.nav.addListing`), and `setLocale(next)`:
  1. writes the `locale` cookie (1-year expiry, `path=/`),
  2. updates context state (client components re-render instantly),
  3. calls `router.refresh()` so Server Components re-render with the new cookie,
  4. sets `document.documentElement.lang`.

### Toggle: `components/i18n/LanguageToggle.tsx` (client)

- Segmented `KA | EN` control, placed in the Navbar top row (right actions),
  visible on both desktop and mobile.
- Active locale highlighted; click switches. Uses `useT()`.
- `aria-label` + `aria-pressed` per option for accessibility.

### Layout / provider wiring

- [app/layout.tsx](../../../app/layout.tsx): compute `locale = getServerLocale()`,
  set `<html lang={locale}>`, translate the skip-link and `Metadata`, pass
  `locale` into `Providers`.
- [app/providers.tsx](../../../app/providers.tsx): nest
  `LanguageProvider` (inside `SessionProvider`, wrapping `FavoritesProvider`).

## Translation extraction

Every Georgian literal is moved into `ka.ts` under a namespaced key, and the
English equivalent added to `en.ts` under the same key. The call site becomes
`t.<namespace>.<key>` (client) or `dict.<namespace>.<key>` (server). No Georgian
text remains inline in components after this pass.

Namespacing rule: key by the feature area the file belongs to, so each dictionary
namespace maps to one part of the UI and stays independently reviewable.

## Data flow (language switch)

```
User clicks EN in navbar toggle
  -> setLocale("en")
       -> write cookie locale=en
       -> context state = en  ->  all client components re-render (instant)
       -> router.refresh()    ->  server components re-fetch/render with en cookie
       -> document lang = en
  -> whole UI now English, no full page reload
```

On next visit / navigation, `getServerLocale()` and the provider both read the
cookie, so the choice sticks.

## Error handling / edge cases

- Missing cookie → `defaultLocale` (`ka`).
- Unknown cookie value → coerced to `defaultLocale`.
- `en.ts` typed against `ka.ts` shape → missing key fails the build, not at runtime.
- Server/client seeded from the same cookie value → no hydration mismatch on the
  first paint.

## Testing / verification

- Typecheck (`tsc`) confirms dictionary key parity (en mirrors ka).
- Manual: load app (defaults KA), toggle EN → navbar, sub-nav, home, a listing
  page, a service page, login/register, profile, footer, an error/empty state,
  admin panel all switch to English; reload page → stays EN; toggle back → KA.
- Confirm user-written listing content is untouched by the switch.

## Non-goals / YAGNI

- No third locale, no RTL, no locale-aware number/date formatting beyond what
  exists, no per-user DB-stored preference (cookie is enough), no URL prefixes.
