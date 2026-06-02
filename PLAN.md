# MyPet — Implementation Plan

Georgia's premium pet marketplace + B2B services directory.

**Stack:** Next.js 16 · Tailwind CSS v3 · shadcn/ui · Mongoose · NextAuth.js v5 · Anthropic SDK  
**Design:** Premium Beige Minimalism — cream backgrounds, dark charcoal typography, clean cards  
**Branch:** `dev/mypet-platform`

---

## Phase 1 — Frontend ✅ COMPLETE

| Task | Deliverable | Status |
|---|---|---|
| 1 | Next.js bootstrap, Tailwind v3, shadcn/ui, beige design tokens | ✅ |
| 2 | Global navbar with Marketplace ↔ Services module toggle | ✅ |
| 3 | TypeScript types — marketplace, services, reviews | ✅ |
| 4 | `ListingCard`, `LostFoundCard` (SOS), `ListingGrid` | ✅ |
| 5 | URL-driven filter sidebar (species, price, pedigree, location) | ✅ |
| 6 | Marketplace home + Buy/Sell, Adoption, Mating, Lost & Found pages | ✅ |
| 7 | `GoogleBadge`, `ReviewCard`, `ReviewForm`, `ReviewList` | ✅ |
| 8 | `BusinessCard`, `ServiceFilters`, 5 services pages | ✅ |

---

## Phase 2 — Backend & Database

> Requires: MongoDB Atlas connection string → `MONGODB_URI` in `.env.local`

| Task | Deliverable | Status |
|---|---|---|
| 9 | Mongoose connection singleton (`lib/db.ts`) | ⬜ |
| 10 | Models: `Listing`, `Business`, `Review`, `User` | ⬜ |
| 11 | Marketplace API routes — `GET /api/marketplace/[type]`, `POST` | ⬜ |
| 12 | Services API — `GET /api/services/[category]` · Reviews API — `POST /api/reviews` with aggregate rating recalc | ⬜ |
| 13 | Wire frontend pages to live API (replace mock data) | ⬜ |

---

## Phase 3 — Authentication

| Task | Deliverable | Status |
|---|---|---|
| 14 | NextAuth.js v5 — credentials + Google OAuth, register API, session-aware Navbar | ⬜ |

---

## Phase 4 — AI Integration

| Task | Deliverable | Status |
|---|---|---|
| 15 | AI Smart Search — Claude parses natural language queries into structured filters | ⬜ |
| 16 | AI Lost Pet Matcher — Claude vision matches uploaded photo against lost reports | ⬜ |

---

## Phase 5 — Production

| Task | Deliverable | Status |
|---|---|---|
| 17 | Seed script + Google Reviews import | ⬜ |
| 18 | Vercel deployment config (`vercel.ts`) | ⬜ |

---

## Environment Variables

```env
# Phase 2
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/mypet

# Phase 3
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Phase 4
ANTHROPIC_API_KEY=

# General
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Marketplace Modules

| Module | URL | Filters |
|---|---|---|
| Buy / Sell · ყიდვა/გაყიდვა | `/buy-sell` | Price, breed, species, pedigree (FCI/FCG), vaccinated |
| Adoption · გაჩუქება | `/adoption` | Species, temperament, spayed/neutered |
| Mating · შეჯვარება | `/mating` | Sex, breed, weight, pedigree, location |
| Lost & Found · დაკარგული | `/lost-found` | Status (lost/found), neighborhood, date range |

## Services Modules

| Module | URL | Special Filters |
|---|---|---|
| Vet Clinics · ვეტ. კლინიკები | `/services/vet-clinics` | 24/7, emergency services |
| Pet Hotels · ძაღლების სასტუმრო | `/services/pet-hotels` | Price/night, capacity |
| Pet Shops · Pet მაღაზიები | `/services/pet-shops` | Location, brands |
| Pet-Friendly · Pet-Friendly ადგილები | `/services/pet-friendly` | Indoor allowed |

---

## Review System

- **Hybrid:** Google Reviews (imported, shown with Google badge) + native user reviews
- **Aggregate rating:** recalculated on every native review submission
- **Review card fields:** name, avatar, star rating (1–5), date, text, source badge
- **Source field:** `'google' | 'native'` — Google badge renders only on `google` source

---

## File Structure

```
app/
  (marketplace)/        → routes: /, /buy-sell, /adoption, /mating, /lost-found
  (services)/           → routes: /services, /services/vet-clinics, ...
  (auth)/               → routes: /login, /register
  api/
    marketplace/[type]/
    services/[category]/
    reviews/
    auth/[...nextauth]/
components/
  layout/               Navbar, ModuleToggle, SignOutButton
  marketplace/          ListingCard, LostFoundCard, ListingGrid, ListingFilters
  services/             BusinessCard, ServiceFilters
  reviews/              GoogleBadge, ReviewCard, ReviewForm, ReviewList
  ui/                   shadcn components
lib/
  db.ts
  models/               Listing, Business, Review, User
  utils/                cn.ts
types/                  marketplace.ts, services.ts, reviews.ts
```

---

*Full task-by-task implementation detail: `docs/superpowers/plans/2026-06-03-mypet-platform.md`*
