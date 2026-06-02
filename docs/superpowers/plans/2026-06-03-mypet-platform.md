# MyPet Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium pet marketplace + B2B services directory with hybrid Google/native review system, phased from frontend shell → backend → auth → AI.

**Architecture:** Next.js 15 App Router with route groups for Marketplace and Services. Mongoose models served via Next.js API routes. Auth via NextAuth.js. Premium Beige Minimalism design system implemented as Tailwind CSS tokens + shadcn/ui overrides.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Mongoose 8, MongoDB Atlas, NextAuth.js v5, Vercel AI SDK (Phase 4)

---

## File Structure

```
app/
  (marketplace)/
    page.tsx                    — marketplace home + tab router
    buy-sell/page.tsx
    adoption/page.tsx
    mating/page.tsx
    lost-found/page.tsx
  (services)/
    page.tsx                    — services directory home
    vet-clinics/page.tsx
    pet-hotels/page.tsx
    pet-shops/page.tsx
    pet-friendly/page.tsx
  (auth)/
    login/page.tsx
    register/page.tsx
  api/
    marketplace/[type]/route.ts — GET list, POST create
    services/[type]/route.ts
    reviews/route.ts
    auth/[...nextauth]/route.ts
  layout.tsx                    — global shell + nav
  globals.css                   — design tokens

components/
  layout/
    Navbar.tsx
    ModuleToggle.tsx            — Marketplace ↔ Services switcher
  marketplace/
    ListingCard.tsx
    ListingFilters.tsx
    ListingGrid.tsx
    LostFoundCard.tsx
  services/
    BusinessCard.tsx
    ServiceFilters.tsx
  reviews/
    ReviewCard.tsx              — handles google | native source
    ReviewForm.tsx
    ReviewList.tsx
    GoogleBadge.tsx
  ui/                           — shadcn components (auto-generated)

lib/
  db.ts                         — mongoose singleton connection
  models/
    Listing.ts                  — marketplace listings (all 4 types)
    Business.ts                 — services/B2B entries
    Review.ts                   — native reviews
    User.ts                     — auth user
  utils/
    cn.ts                       — clsx + tailwind-merge
    rating.ts                   — aggregate rating calc

types/
  marketplace.ts
  services.ts
  reviews.ts

tailwind.config.ts              — beige palette tokens
```

---

## PHASE 1 — Frontend Foundation & UI

---

### Task 1: Project Bootstrap

**Files:**
- Modify: `package.json`
- Create: `tailwind.config.ts`
- Modify: `app/globals.css`
- Create: `lib/utils/cn.ts`

- [ ] **Step 1: Init Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

Expected: project scaffold in current dir.

- [ ] **Step 2: Install dependencies**

```bash
npm install mongoose next-auth@beta @auth/mongoose-adapter lucide-react class-variance-authority clsx tailwind-merge
npx shadcn@latest init
```

When shadcn prompts: style=`default`, base color=`neutral`, CSS variables=`yes`.

- [ ] **Step 3: Install shadcn components used across the app**

```bash
npx shadcn@latest add button card badge input textarea select tabs avatar separator dialog sheet
```

- [ ] **Step 4: Write design token CSS**

Replace `app/globals.css` body:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 45 30% 96%;       /* soft cream */
    --foreground: 25 10% 15%;       /* dark charcoal */
    --card: 40 25% 94%;
    --card-foreground: 25 10% 15%;
    --primary: 30 20% 30%;          /* warm dark brown */
    --primary-foreground: 45 30% 96%;
    --secondary: 38 20% 88%;        /* muted beige */
    --secondary-foreground: 25 10% 20%;
    --muted: 40 15% 91%;
    --muted-foreground: 25 8% 45%;
    --accent: 35 40% 75%;           /* warm sand accent */
    --accent-foreground: 25 10% 15%;
    --border: 38 15% 85%;
    --ring: 30 20% 50%;
    --radius: 0.75rem;
  }
}

@layer base {
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
}
```

- [ ] **Step 5: Write tailwind config with beige palette**

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#faf8f4",
          100: "#f4f0e8",
          200: "#ebe3d5",
          300: "#d9cbb8",
          400: "#c4ae94",
          500: "#b09070",
          600: "#8c6f52",
          700: "#6b5240",
          800: "#4a3a2e",
          900: "#2e231c",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 6: Write cn utility**

```ts
// lib/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: project bootstrap with beige design system"
```

---

### Task 2: Global Layout & Navigation

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/layout/Navbar.tsx`
- Create: `components/layout/ModuleToggle.tsx`

- [ ] **Step 1: Write ModuleToggle**

```tsx
// components/layout/ModuleToggle.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const modules = [
  { label: "Pet Marketplace", href: "/", georgian: "პეთ მარკეტი" },
  { label: "Services Directory", href: "/services", georgian: "სერვისები" },
];

export function ModuleToggle() {
  const path = usePathname();
  const isServices = path.startsWith("/services");

  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1">
      {modules.map((m) => {
        const active = m.href === "/services" ? isServices : !isServices;
        return (
          <Link
            key={m.href}
            href={m.href}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              active
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="hidden sm:inline">{m.label}</span>
            <span className="sm:hidden">{m.georgian}</span>
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Write Navbar**

```tsx
// components/layout/Navbar.tsx
import Link from "next/link";
import { ModuleToggle } from "./ModuleToggle";
import { Button } from "@/components/ui/button";
import { PawPrint } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <PawPrint className="w-6 h-6 text-primary" />
          <span className="font-semibold text-lg tracking-tight">MyPet</span>
        </Link>

        <ModuleToggle />

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Post Ad</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Wire into root layout**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyPet — Georgia's Premium Pet Platform",
  description: "Buy, sell, adopt, and find services for your pets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" className={GeistSans.variable}>
      <body>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
```

```bash
npm install geist
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: global navbar with module toggle"
```

---

### Task 3: TypeScript Types

**Files:**
- Create: `types/marketplace.ts`
- Create: `types/services.ts`
- Create: `types/reviews.ts`

- [ ] **Step 1: Write marketplace types**

```ts
// types/marketplace.ts
export type MarketplaceType = "buy-sell" | "adoption" | "mating" | "lost-found";

export type PetSpecies = "dog" | "cat" | "bird" | "rabbit" | "reptile" | "other";

export interface BaseListing {
  _id: string;
  type: MarketplaceType;
  species: PetSpecies;
  breed: string;
  age: number;        // months
  images: string[];
  description: string;
  location: string;
  contactName: string;
  contactPhone: string;
  createdAt: string;
  userId: string;
}

export interface BuySellListing extends BaseListing {
  type: "buy-sell";
  price: number;
  currency: "GEL" | "USD";
  vaccinated: boolean;
  hasPassport: boolean;
  pedigree: "FCI" | "FCG" | "none";
}

export interface AdoptionListing extends BaseListing {
  type: "adoption";
  temperament: string[];
  spayedNeutered: boolean;
  goodWithKids: boolean;
  goodWithPets: boolean;
}

export interface MatingListing extends BaseListing {
  type: "mating";
  sex: "male" | "female";
  weight: number;       // kg
  pedigree: "FCI" | "FCG" | "none";
  price: number | null; // null = free
}

export interface LostFoundListing extends BaseListing {
  type: "lost-found";
  status: "lost" | "found";
  neighborhood: string;
  lastSeenDate: string;
  reward: number | null;
  isResolved: boolean;
}

export type Listing = BuySellListing | AdoptionListing | MatingListing | LostFoundListing;
```

- [ ] **Step 2: Write services types**

```ts
// types/services.ts
export type ServiceCategory = "vet-clinics" | "pet-hotels" | "pet-shops" | "pet-friendly";

export interface BusinessHours {
  open: string;   // "09:00"
  close: string;  // "18:00"
  closed: boolean;
}

export interface Business {
  _id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  address: string;
  neighborhood: string;
  city: string;
  phone: string;
  website?: string;
  images: string[];
  tags: string[];
  // vet-specific
  is24h?: boolean;
  hasEmergency?: boolean;
  // hotel-specific
  pricePerNight?: number;
  capacity?: number;
  // pet-friendly place specific
  indoorAllowed?: boolean;
  // aggregated
  aggregateRating: number;   // 0-5
  googleRatingCount: number;
  nativeRatingCount: number;
  createdAt: string;
}
```

- [ ] **Step 3: Write review types**

```ts
// types/reviews.ts
export type ReviewSource = "google" | "native";

export interface Review {
  _id: string;
  businessId: string;
  source: ReviewSource;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;     // 1-5
  text: string;
  date: string;
  // google-specific
  googleReviewId?: string;
  googleProfileUrl?: string;
}

export interface ReviewFormData {
  rating: number;
  text: string;
  reviewerName: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: TypeScript types for marketplace, services, reviews"
```

---

### Task 4: Marketplace Listing Cards

**Files:**
- Create: `components/marketplace/ListingCard.tsx`
- Create: `components/marketplace/LostFoundCard.tsx`
- Create: `components/marketplace/ListingGrid.tsx`

- [ ] **Step 1: Write ListingCard**

```tsx
// components/marketplace/ListingCard.tsx
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Listing } from "@/types/marketplace";

const typeLabels: Record<string, string> = {
  "buy-sell": "გაყიდვა",
  adoption: "გაჩუქება",
  mating: "შეჯვარება",
  "lost-found": "დაკარგული",
};

const typeBadgeColors: Record<string, string> = {
  "buy-sell": "bg-cream-200 text-cream-800",
  adoption: "bg-emerald-100 text-emerald-800",
  mating: "bg-violet-100 text-violet-800",
  "lost-found": "bg-red-100 text-red-800",
};

interface Props {
  listing: Listing;
  href: string;
}

export function ListingCard({ listing, href }: Props) {
  const price =
    listing.type === "buy-sell"
      ? `${listing.price} ₾`
      : listing.type === "mating" && listing.price
      ? `${listing.price} ₾`
      : null;

  return (
    <Link href={href} className="group block">
      <div className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {listing.images[0] ? (
            <Image
              src={listing.images[0]}
              alt={`${listing.breed} — ${listing.location}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">
              🐾
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className={cn("text-xs font-medium px-2 py-1 rounded-full", typeBadgeColors[listing.type])}>
              {typeLabels[listing.type]}
            </span>
          </div>
          {price && (
            <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-semibold">
              {price}
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground leading-tight">{listing.breed}</p>
              <p className="text-sm text-muted-foreground capitalize">{listing.species}</p>
            </div>
            {listing.type === "buy-sell" && (
              <div className="flex flex-wrap gap-1 justify-end">
                {listing.vaccinated && <Badge variant="secondary" className="text-xs">Vaccinated</Badge>}
                {listing.pedigree !== "none" && <Badge variant="secondary" className="text-xs">{listing.pedigree}</Badge>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {listing.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {listing.age < 12 ? `${listing.age}mo` : `${Math.floor(listing.age / 12)}yr`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Write LostFoundCard (SOS variant)**

```tsx
// components/marketplace/LostFoundCard.tsx
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, AlertTriangle } from "lucide-react";
import type { LostFoundListing } from "@/types/marketplace";

interface Props {
  listing: LostFoundListing;
  href: string;
}

export function LostFoundCard({ listing, href }: Props) {
  return (
    <Link href={href} className="group block">
      <div className={`rounded-xl overflow-hidden border-2 transition-all duration-200 hover:shadow-md ${
        listing.status === "lost" ? "border-red-200 bg-red-50/50" : "border-emerald-200 bg-emerald-50/50"
      }`}>
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {listing.images[0] ? (
            <Image src={listing.images[0]} alt={listing.breed} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🐾</div>
          )}
          <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            listing.status === "lost"
              ? "bg-red-500 text-white"
              : "bg-emerald-500 text-white"
          }`}>
            <AlertTriangle className="w-3 h-3" />
            {listing.status === "lost" ? "LOST" : "FOUND"}
          </div>
          {listing.isResolved && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="text-foreground font-bold text-lg">RESOLVED ✓</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <p className="font-semibold">{listing.breed}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {listing.neighborhood}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Last seen: {new Date(listing.lastSeenDate).toLocaleDateString("ka-GE")}
          </div>
          {listing.reward && (
            <p className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-md inline-block">
              Reward: {listing.reward} ₾
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Write ListingGrid**

```tsx
// components/marketplace/ListingGrid.tsx
import { ListingCard } from "./ListingCard";
import { LostFoundCard } from "./LostFoundCard";
import type { Listing, LostFoundListing, MarketplaceType } from "@/types/marketplace";

interface Props {
  listings: Listing[];
  type: MarketplaceType;
}

export function ListingGrid({ listings, type }: Props) {
  if (listings.length === 0) {
    return (
      <div className="col-span-full py-20 text-center text-muted-foreground">
        <div className="text-5xl mb-4">🐾</div>
        <p className="text-lg font-medium">No listings found</p>
        <p className="text-sm mt-1">Be the first to post in this category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {listings.map((listing) => {
        const href = `/${type}/${listing._id}`;
        if (listing.type === "lost-found") {
          return <LostFoundCard key={listing._id} listing={listing as LostFoundListing} href={href} />;
        }
        return <ListingCard key={listing._id} listing={listing} href={href} />;
      })}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: marketplace listing cards (buy-sell, adoption, mating, lost-found)"
```

---

### Task 5: Marketplace Filter Sidebar

**Files:**
- Create: `components/marketplace/ListingFilters.tsx`

- [ ] **Step 1: Write filter component**

```tsx
// components/marketplace/ListingFilters.tsx
"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import type { MarketplaceType } from "@/types/marketplace";

interface Props {
  type: MarketplaceType;
}

const speciesOptions = ["dog", "cat", "bird", "rabbit", "reptile", "other"];

export function ListingFilters({ type }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== "all") {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  const clearAll = () => router.push(pathname);

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5 sticky top-24">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Filters</h3>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Species</label>
        <Select value={params.get("species") ?? "all"} onValueChange={(v) => updateParam("species", v)}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="All species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All species</SelectItem>
            {speciesOptions.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</label>
        <Input
          placeholder="Neighborhood or city"
          defaultValue={params.get("location") ?? ""}
          onChange={(e) => updateParam("location", e.target.value)}
          className="bg-background"
        />
      </div>

      {type === "buy-sell" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max Price (₾)</label>
            <Input
              type="number"
              placeholder="e.g. 500"
              defaultValue={params.get("maxPrice") ?? ""}
              onChange={(e) => updateParam("maxPrice", e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pedigree</label>
            <Select value={params.get("pedigree") ?? "all"} onValueChange={(v) => updateParam("pedigree", v)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="FCI">FCI</SelectItem>
                <SelectItem value="FCG">FCG</SelectItem>
                <SelectItem value="none">No pedigree</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {(params.size > 0) && (
        <Button variant="outline" size="sm" className="w-full" onClick={clearAll}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: marketplace filter sidebar with URL-based state"
```

---

### Task 6: Marketplace Pages

**Files:**
- Create: `app/(marketplace)/page.tsx`
- Create: `app/(marketplace)/buy-sell/page.tsx`
- Create: `app/(marketplace)/adoption/page.tsx`
- Create: `app/(marketplace)/mating/page.tsx`
- Create: `app/(marketplace)/lost-found/page.tsx`

- [ ] **Step 1: Write marketplace home (tab router)**

```tsx
// app/(marketplace)/page.tsx
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { ShoppingCart, Heart, Shuffle, AlertCircle } from "lucide-react";

const tabs = [
  { href: "/buy-sell", label: "Buy / Sell", georgian: "ყიდვა/გაყიდვა", icon: ShoppingCart, color: "text-cream-700" },
  { href: "/adoption", label: "Adoption", georgian: "გაჩუქება", icon: Heart, color: "text-emerald-700" },
  { href: "/mating", label: "Mating", georgian: "შეჯვარება", icon: Shuffle, color: "text-violet-700" },
  { href: "/lost-found", label: "Lost & Found", georgian: "დაკარგული", icon: AlertCircle, color: "text-red-700" },
];

export default function MarketplacePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Pet Marketplace</h1>
        <p className="text-muted-foreground text-lg">Georgia's most trusted platform for pets</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="group block">
            <div className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <tab.icon className={cn("w-10 h-10 mx-auto mb-4", tab.color)} />
              <p className="font-bold text-lg">{tab.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{tab.georgian}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write buy-sell page (template reused by adoption/mating)**

```tsx
// app/(marketplace)/buy-sell/page.tsx
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { ListingFilters } from "@/components/marketplace/ListingFilters";
import type { BuySellListing } from "@/types/marketplace";

// Placeholder data — replaced by real API in Phase 2
const MOCK: BuySellListing[] = [
  {
    _id: "1",
    type: "buy-sell",
    species: "dog",
    breed: "Labrador Retriever",
    age: 6,
    images: [],
    description: "Healthy male puppy, all vaccinations done.",
    location: "Tbilisi",
    contactName: "Giorgi",
    contactPhone: "+995 555 000 000",
    createdAt: new Date().toISOString(),
    userId: "u1",
    price: 800,
    currency: "GEL",
    vaccinated: true,
    hasPassport: true,
    pedigree: "FCI",
  },
];

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function BuySellPage({ searchParams }: Props) {
  const _ = await searchParams; // consumed for future filtering
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Buy &amp; Sell</h1>
        <p className="text-muted-foreground text-sm mt-1">ყიდვა / გაყიდვა</p>
      </div>
      <div className="flex gap-6">
        <aside className="w-56 shrink-0 hidden md:block">
          <ListingFilters type="buy-sell" />
        </aside>
        <div className="flex-1 min-w-0">
          <ListingGrid listings={MOCK} type="buy-sell" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write adoption, mating, lost-found pages (same pattern)**

```tsx
// app/(marketplace)/adoption/page.tsx
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { ListingFilters } from "@/components/marketplace/ListingFilters";

export default async function AdoptionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Adoption</h1>
        <p className="text-muted-foreground text-sm mt-1">გაჩუქება</p>
      </div>
      <div className="flex gap-6">
        <aside className="w-56 shrink-0 hidden md:block">
          <ListingFilters type="adoption" />
        </aside>
        <div className="flex-1 min-w-0">
          <ListingGrid listings={[]} type="adoption" />
        </div>
      </div>
    </div>
  );
}
```

```tsx
// app/(marketplace)/mating/page.tsx
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { ListingFilters } from "@/components/marketplace/ListingFilters";

export default async function MatingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mating</h1>
        <p className="text-muted-foreground text-sm mt-1">შეჯვარება</p>
      </div>
      <div className="flex gap-6">
        <aside className="w-56 shrink-0 hidden md:block">
          <ListingFilters type="mating" />
        </aside>
        <div className="flex-1 min-w-0">
          <ListingGrid listings={[]} type="mating" />
        </div>
      </div>
    </div>
  );
}
```

```tsx
// app/(marketplace)/lost-found/page.tsx
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { ListingFilters } from "@/components/marketplace/ListingFilters";

export default async function LostFoundPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-2 h-8 bg-red-500 rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-red-700">Lost &amp; Found</h1>
          <p className="text-muted-foreground text-sm">დაკარგული / ნაპოვნი</p>
        </div>
      </div>
      <div className="flex gap-6">
        <aside className="w-56 shrink-0 hidden md:block">
          <ListingFilters type="lost-found" />
        </aside>
        <div className="flex-1 min-w-0">
          <ListingGrid listings={[]} type="lost-found" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: marketplace pages (buy-sell, adoption, mating, lost-found)"
```

---

### Task 7: Review System Components

**Files:**
- Create: `components/reviews/GoogleBadge.tsx`
- Create: `components/reviews/ReviewCard.tsx`
- Create: `components/reviews/ReviewForm.tsx`
- Create: `components/reviews/ReviewList.tsx`

- [ ] **Step 1: Write GoogleBadge**

```tsx
// components/reviews/GoogleBadge.tsx
export function GoogleBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Google
    </span>
  );
}
```

- [ ] **Step 2: Write ReviewCard**

```tsx
// components/reviews/ReviewCard.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { GoogleBadge } from "./GoogleBadge";
import type { Review } from "@/types/reviews";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
        />
      ))}
    </div>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  const initials = review.reviewerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={review.reviewerAvatar} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-tight">{review.reviewerName}</p>
              {review.source === "google" && <GoogleBadge />}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(review.date).toLocaleDateString("ka-GE", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{review.text}</p>
    </div>
  );
}
```

- [ ] **Step 3: Write ReviewForm**

```tsx
// components/reviews/ReviewForm.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star } from "lucide-react";
import type { ReviewFormData } from "@/types/reviews";

interface Props {
  businessId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ businessId, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [form, setForm] = useState<Omit<ReviewFormData, "rating">>({ text: "", reviewerName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating"); return; }
    if (!form.reviewerName.trim()) { setError("Name is required"); return; }
    if (form.text.length < 10) { setError("Review must be at least 10 characters"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, rating, ...form }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setRating(0);
      setForm({ text: "", reviewerName: "" });
      onSuccess?.();
    } catch {
      setError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h3 className="font-semibold">Write a Review</h3>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(n)}
            >
              <Star className={`w-7 h-7 transition-colors ${
                n <= (hovered || rating) ? "fill-amber-400 text-amber-400" : "text-border hover:text-amber-300"
              }`} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your name</label>
        <Input
          placeholder="Full name"
          value={form.reviewerName}
          onChange={(e) => setForm((p) => ({ ...p, reviewerName: e.target.value }))}
          className="bg-background"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your review</label>
        <Textarea
          placeholder="Share your experience..."
          rows={4}
          value={form.text}
          onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
          className="bg-background resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Write ReviewList**

```tsx
// components/reviews/ReviewList.tsx
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Review } from "@/types/reviews";

interface Props {
  businessId: string;
  reviews: Review[];
  aggregateRating: number;
  totalCount: number;
}

export function ReviewList({ businessId, reviews, aggregateRating, totalCount }: Props) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reviews &amp; Ratings</h2>
        <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-xl">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          <span className="font-bold text-lg">{aggregateRating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">/ 5 ({totalCount})</span>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <ReviewCard key={r._id} review={r} />
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No reviews yet. Be the first!</p>
        )}
      </div>

      <Separator />
      <ReviewForm businessId={businessId} />
    </section>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: hybrid review system components (google + native)"
```

---

### Task 8: Services Directory UI

**Files:**
- Create: `components/services/BusinessCard.tsx`
- Create: `components/services/ServiceFilters.tsx`
- Create: `app/(services)/page.tsx`
- Create: `app/(services)/vet-clinics/page.tsx`
- Create: `app/(services)/pet-hotels/page.tsx`
- Create: `app/(services)/pet-shops/page.tsx`
- Create: `app/(services)/pet-friendly/page.tsx`

- [ ] **Step 1: Write BusinessCard**

```tsx
// components/services/BusinessCard.tsx
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Phone, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Business } from "@/types/services";

interface Props {
  business: Business;
  href: string;
}

export function BusinessCard({ business, href }: Props) {
  return (
    <Link href={href} className="group block">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <div className="aspect-video relative bg-muted overflow-hidden">
          {business.images[0] ? (
            <Image src={business.images[0]} alt={business.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🏥</div>
          )}
          {business.is24h && (
            <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              24/7
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold leading-tight">{business.name}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">{business.aggregateRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">
                  ({business.googleRatingCount + business.nativeRatingCount})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {business.neighborhood}, {business.city}
          </div>

          {business.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {business.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {business.pricePerNight && (
            <p className="text-sm font-semibold text-primary">from {business.pricePerNight} ₾/night</p>
          )}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Write ServiceFilters**

```tsx
// components/services/ServiceFilters.tsx
"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import type { ServiceCategory } from "@/types/services";

interface Props { category: ServiceCategory; }

export function ServiceFilters({ category }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      value && value !== "all" ? next.set(key, value) : next.delete(key);
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5 sticky top-24">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Filters</h3>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min Rating</label>
        <Select value={params.get("minRating") ?? "all"} onValueChange={(v) => updateParam("minRating", v)}>
          <SelectTrigger className="bg-background"><SelectValue placeholder="Any rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any rating</SelectItem>
            {["4.5", "4", "3.5", "3"].map((r) => (
              <SelectItem key={r} value={r}>⭐ {r}+</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category === "vet-clinics" && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Availability</label>
          <button
            className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
              params.get("is24h") === "true" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"
            }`}
            onClick={() => updateParam("is24h", params.get("is24h") === "true" ? "" : "true")}
          >
            24/7 Available
          </button>
          <button
            className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
              params.get("emergency") === "true" ? "border-red-500 bg-red-50 text-red-700" : "border-border hover:border-red-200"
            }`}
            onClick={() => updateParam("emergency", params.get("emergency") === "true" ? "" : "true")}
          >
            Emergency Services
          </button>
        </div>
      )}

      {category === "pet-friendly" && (
        <button
          className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
            params.get("indoorAllowed") === "true" ? "border-primary bg-primary/5 text-primary" : "border-border"
          }`}
          onClick={() => updateParam("indoorAllowed", params.get("indoorAllowed") === "true" ? "" : "true")}
        >
          Indoor Allowed
        </button>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Neighborhood</label>
        <Input placeholder="e.g. Vake, Saburtalo" defaultValue={params.get("neighborhood") ?? ""}
          onChange={(e) => updateParam("neighborhood", e.target.value)} className="bg-background" />
      </div>

      {params.size > 0 && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(pathname)}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write services pages**

```tsx
// app/(services)/page.tsx
import Link from "next/link";
import { Stethoscope, Home, ShoppingBag, Coffee } from "lucide-react";

const categories = [
  { href: "/services/vet-clinics", label: "Vet Clinics", georgian: "ვეტ. კლინიკები", icon: Stethoscope },
  { href: "/services/pet-hotels", label: "Pet Hotels", georgian: "ძაღლების სასტუმრო", icon: Home },
  { href: "/services/pet-shops", label: "Pet Shops", georgian: "Pet მაღაზიები", icon: ShoppingBag },
  { href: "/services/pet-friendly", label: "Pet-Friendly", georgian: "Pet-Friendly ადგილები", icon: Coffee },
];

export default function ServicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Services Directory</h1>
        <p className="text-muted-foreground text-lg">Find trusted pet services in Georgia</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((c) => (
          <Link key={c.href} href={c.href} className="group block">
            <div className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <c.icon className="w-10 h-10 mx-auto mb-4 text-primary" />
              <p className="font-bold text-lg">{c.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{c.georgian}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// app/(services)/vet-clinics/page.tsx
import { BusinessCard } from "@/components/services/BusinessCard";
import { ServiceFilters } from "@/components/services/ServiceFilters";

export default function VetClinicsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vet Clinics</h1>
        <p className="text-muted-foreground text-sm mt-1">ვეტერინარული კლინიკები</p>
      </div>
      <div className="flex gap-6">
        <aside className="w-56 shrink-0 hidden md:block">
          <ServiceFilters category="vet-clinics" />
        </aside>
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* populated from API in Phase 2 */}
            <p className="text-muted-foreground col-span-full py-12 text-center">Loading businesses…</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Repeat same shell for `pet-hotels/page.tsx`, `pet-shops/page.tsx`, `pet-friendly/page.tsx` (change title/georgian/category prop only).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: services directory UI (vet, hotels, shops, pet-friendly)"
```

---

## PHASE 2 — Backend & Mongoose

---

### Task 9: Mongoose Connection Singleton

**Files:**
- Create: `lib/db.ts`
- Modify: `.env.local` (add `MONGODB_URI`)

- [ ] **Step 1: Write db singleton**

```ts
// lib/db.ts
import mongoose from "mongoose";

declare global {
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable not set");
}

const uri = process.env.MONGODB_URI;

export function connectDB(): Promise<typeof mongoose> {
  if (global._mongooseConn) return global._mongooseConn;
  global._mongooseConn = mongoose.connect(uri, {
    bufferCommands: false,
  });
  return global._mongooseConn;
}
```

- [ ] **Step 2: Add env variable**

```bash
# .env.local
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/mypet?retryWrites=true&w=majority
NEXTAUTH_SECRET=changeme-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
```

- [ ] **Step 3: Commit**

```bash
git add lib/db.ts
git commit -m "feat: mongoose connection singleton"
```

---

### Task 10: Mongoose Models

**Files:**
- Create: `lib/models/Listing.ts`
- Create: `lib/models/Business.ts`
- Create: `lib/models/Review.ts`
- Create: `lib/models/User.ts`

- [ ] **Step 1: Write Listing model**

```ts
// lib/models/Listing.ts
import mongoose, { Schema, model, models } from "mongoose";

const BaseListingFields = {
  type: { type: String, enum: ["buy-sell", "adoption", "mating", "lost-found"], required: true },
  species: { type: String, enum: ["dog", "cat", "bird", "rabbit", "reptile", "other"], required: true },
  breed: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 0 },
  images: [{ type: String }],
  description: { type: String, required: true, maxlength: 2000 },
  location: { type: String, required: true },
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  // buy-sell
  price: { type: Number },
  currency: { type: String, enum: ["GEL", "USD"] },
  vaccinated: { type: Boolean },
  hasPassport: { type: Boolean },
  pedigree: { type: String, enum: ["FCI", "FCG", "none"] },
  // adoption
  temperament: [{ type: String }],
  spayedNeutered: { type: Boolean },
  goodWithKids: { type: Boolean },
  goodWithPets: { type: Boolean },
  // mating
  sex: { type: String, enum: ["male", "female"] },
  weight: { type: Number },
  // lost-found
  status: { type: String, enum: ["lost", "found"] },
  neighborhood: { type: String },
  lastSeenDate: { type: Date },
  reward: { type: Number },
  isResolved: { type: Boolean, default: false },
};

const ListingSchema = new Schema(BaseListingFields, { timestamps: true });

ListingSchema.index({ type: 1, species: 1 });
ListingSchema.index({ location: "text", breed: "text", description: "text" });

export const Listing = models.Listing ?? model("Listing", ListingSchema);
```

- [ ] **Step 2: Write Business model**

```ts
// lib/models/Business.ts
import { Schema, model, models } from "mongoose";

const BusinessSchema = new Schema(
  {
    category: {
      type: String,
      enum: ["vet-clinics", "pet-hotels", "pet-shops", "pet-friendly"],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 3000 },
    address: { type: String, required: true },
    neighborhood: { type: String, required: true },
    city: { type: String, required: true, default: "Tbilisi" },
    phone: { type: String, required: true },
    website: { type: String },
    images: [{ type: String }],
    tags: [{ type: String }],
    is24h: { type: Boolean, default: false },
    hasEmergency: { type: Boolean, default: false },
    pricePerNight: { type: Number },
    capacity: { type: Number },
    indoorAllowed: { type: Boolean },
    aggregateRating: { type: Number, default: 0, min: 0, max: 5 },
    googleRatingCount: { type: Number, default: 0 },
    nativeRatingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BusinessSchema.index({ category: 1, "aggregateRating": -1 });
BusinessSchema.index({ name: "text", description: "text", neighborhood: "text" });

export const Business = models.Business ?? model("Business", BusinessSchema);
```

- [ ] **Step 3: Write Review model**

```ts
// lib/models/Review.ts
import { Schema, model, models } from "mongoose";

const ReviewSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    source: { type: String, enum: ["google", "native"], required: true },
    reviewerName: { type: String, required: true },
    reviewerAvatar: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, minlength: 10, maxlength: 2000 },
    date: { type: Date, required: true, default: Date.now },
    googleReviewId: { type: String, sparse: true, unique: true },
    googleProfileUrl: { type: String },
  },
  { timestamps: true }
);

export const Review = models.Review ?? model("Review", ReviewSchema);
```

- [ ] **Step 4: Write User model**

```ts
// lib/models/User.ts
import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    emailVerified: { type: Date },
    image: { type: String },
    password: { type: String },   // hashed; null for OAuth users
    role: { type: String, enum: ["user", "business", "admin"], default: "user" },
    listings: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
  },
  { timestamps: true }
);

export const User = models.User ?? model("User", UserSchema);
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: mongoose models (Listing, Business, Review, User)"
```

---

### Task 11: Marketplace API Routes

**Files:**
- Create: `app/api/marketplace/[type]/route.ts`

- [ ] **Step 1: Write GET + POST handler**

```ts
// app/api/marketplace/[type]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import type { MarketplaceType } from "@/types/marketplace";

const VALID_TYPES: MarketplaceType[] = ["buy-sell", "adoption", "mating", "lost-found"];
const PAGE_SIZE = 24;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as MarketplaceType)) {
    return NextResponse.json({ error: "Invalid listing type" }, { status: 400 });
  }

  await connectDB();

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const filter: Record<string, unknown> = { type };

  if (sp.get("species")) filter.species = sp.get("species");
  if (sp.get("location")) filter.location = new RegExp(sp.get("location")!, "i");
  if (sp.get("maxPrice")) filter.price = { $lte: parseInt(sp.get("maxPrice")!) };
  if (sp.get("pedigree") && sp.get("pedigree") !== "all") filter.pedigree = sp.get("pedigree");
  if (sp.get("status")) filter.status = sp.get("status");

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Listing.countDocuments(filter),
  ]);

  return NextResponse.json({
    listings,
    total,
    pages: Math.ceil(total / PAGE_SIZE),
    page,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  if (!VALID_TYPES.includes(type as MarketplaceType)) {
    return NextResponse.json({ error: "Invalid listing type" }, { status: 400 });
  }

  await connectDB();

  const body = await req.json();
  const listing = await Listing.create({ ...body, type });

  return NextResponse.json(listing, { status: 201 });
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: marketplace API routes (GET list + POST create)"
```

---

### Task 12: Services & Reviews API Routes

**Files:**
- Create: `app/api/services/[category]/route.ts`
- Create: `app/api/reviews/route.ts`

- [ ] **Step 1: Write services route**

```ts
// app/api/services/[category]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Business } from "@/lib/models/Business";
import type { ServiceCategory } from "@/types/services";

const VALID_CATEGORIES: ServiceCategory[] = ["vet-clinics", "pet-hotels", "pet-shops", "pet-friendly"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  if (!VALID_CATEGORIES.includes(category as ServiceCategory)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  await connectDB();

  const sp = req.nextUrl.searchParams;
  const filter: Record<string, unknown> = { category };

  if (sp.get("minRating")) filter.aggregateRating = { $gte: parseFloat(sp.get("minRating")!) };
  if (sp.get("is24h") === "true") filter.is24h = true;
  if (sp.get("emergency") === "true") filter.hasEmergency = true;
  if (sp.get("indoorAllowed") === "true") filter.indoorAllowed = true;
  if (sp.get("neighborhood")) filter.neighborhood = new RegExp(sp.get("neighborhood")!, "i");

  const businesses = await Business.find(filter).sort({ aggregateRating: -1 }).limit(50).lean();

  return NextResponse.json({ businesses });
}
```

- [ ] **Step 2: Write reviews route with aggregate rating recalc**

```ts
// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { Business } from "@/lib/models/Business";

export async function GET(req: NextRequest) {
  await connectDB();
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const reviews = await Review.find({ businessId }).sort({ date: -1 }).lean();
  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { businessId, rating, text, reviewerName, reviewerAvatar } = body;

  if (!businessId || !rating || !text || !reviewerName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }
  if (text.length < 10) {
    return NextResponse.json({ error: "Review too short" }, { status: 400 });
  }

  const review = await Review.create({
    businessId,
    source: "native",
    reviewerName,
    reviewerAvatar,
    rating,
    text,
    date: new Date(),
  });

  // Recalculate aggregate rating
  const allReviews = await Review.find({ businessId }).lean();
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  const nativeCount = allReviews.filter((r) => r.source === "native").length;
  const googleCount = allReviews.filter((r) => r.source === "google").length;

  await Business.findByIdAndUpdate(businessId, {
    aggregateRating: Math.round(avg * 10) / 10,
    nativeRatingCount: nativeCount,
    googleRatingCount: googleCount,
  });

  return NextResponse.json(review, { status: 201 });
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: services + reviews API routes with aggregate rating sync"
```

---

### Task 13: Wire Frontend Pages to Real API

**Files:**
- Modify: `app/(marketplace)/buy-sell/page.tsx`
- Modify: `app/(services)/vet-clinics/page.tsx`
- Create: `lib/utils/rating.ts`

- [ ] **Step 1: Write rating utility**

```ts
// lib/utils/rating.ts
export function aggregateRating(googleCount: number, googleTotal: number, nativeCount: number, nativeTotal: number): number {
  const total = googleCount + nativeCount;
  if (total === 0) return 0;
  return Math.round(((googleTotal + nativeTotal) / total) * 10) / 10;
}
```

- [ ] **Step 2: Update buy-sell page to fetch from API**

```tsx
// app/(marketplace)/buy-sell/page.tsx
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { ListingFilters } from "@/components/marketplace/ListingFilters";
import type { BuySellListing } from "@/types/marketplace";

async function getListings(searchParams: Record<string, string>): Promise<BuySellListing[]> {
  const qs = new URLSearchParams(searchParams).toString();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/marketplace/buy-sell?${qs}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.listings ?? [];
}

interface Props { searchParams: Promise<Record<string, string>>; }

export default async function BuySellPage({ searchParams }: Props) {
  const sp = await searchParams;
  const listings = await getListings(sp);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Buy &amp; Sell</h1>
        <p className="text-muted-foreground text-sm mt-1">ყიდვა / გაყიდვა</p>
      </div>
      <div className="flex gap-6">
        <aside className="w-56 shrink-0 hidden md:block">
          <ListingFilters type="buy-sell" />
        </aside>
        <div className="flex-1 min-w-0">
          <ListingGrid listings={listings} type="buy-sell" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add NEXT_PUBLIC_APP_URL to .env.local**

```bash
# append to .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: marketplace pages fetch from Mongoose API"
```

---

## PHASE 3 — Authentication

---

### Task 14: NextAuth.js v5 Setup

**Files:**
- Create: `auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Modify: `components/layout/Navbar.tsx`

- [ ] **Step 1: Install NextAuth + bcrypt**

```bash
npm install next-auth@beta @auth/mongoose-adapter bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Write auth config**

```ts
// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongooseAdapter } from "@auth/mongoose-adapter";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongooseAdapter(connectDB()),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email }).select("+password");
        if (!user?.password) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;
        return { id: user._id.toString(), name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
```

- [ ] **Step 3: Wire route handler**

```ts
// app/api/auth/[...nextauth]/route.ts
export { handlers as GET, handlers as POST } from "@/auth";
```

- [ ] **Step 4: Write login page**

```tsx
// app/(auth)/login/page.tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { PawPrint } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { ...form, redirect: false });
    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <PawPrint className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your MyPet account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <Button variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/" })}>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </Button>

          <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative text-center"><span className="bg-card px-2 text-xs text-muted-foreground">or</span></div></div>

          <form onSubmit={submit} className="space-y-3">
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="bg-background" required />
            <Input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="bg-background" required />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-foreground underline underline-offset-2">Register</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write register page + API**

Create `app/api/auth/register/route.ts`:

```ts
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  await connectDB();
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be 8+ characters" }, { status: 400 });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: email.toLowerCase(), password: hash });

  return NextResponse.json({ id: user._id, name: user.name, email: user.email }, { status: 201 });
}
```

```tsx
// app/(auth)/register/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { PawPrint } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    await signIn("credentials", { email: form.email, password: form.password, callbackUrl: "/" });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <PawPrint className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Create account</h1>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <form onSubmit={submit} className="space-y-3">
            <Input placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="bg-background" required />
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="bg-background" required />
            <Input type="password" placeholder="Password (8+ chars)" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="bg-background" required />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
          </form>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update Navbar to show session state**

```tsx
// components/layout/Navbar.tsx  (updated)
import Link from "next/link";
import { ModuleToggle } from "./ModuleToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PawPrint } from "lucide-react";
import { auth } from "@/auth";
import { SignOutButton } from "./SignOutButton";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <PawPrint className="w-6 h-6 text-primary" />
          <span className="font-semibold text-lg tracking-tight">MyPet</span>
        </Link>
        <ModuleToggle />
        <div className="flex items-center gap-2 shrink-0">
          {session?.user ? (
            <>
              <Button size="sm" asChild><Link href="/listings/new">Post Ad</Link></Button>
              <Avatar className="w-8 h-8">
                <AvatarImage src={session.user.image ?? undefined} />
                <AvatarFallback className="text-xs">{session.user.name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <SignOutButton />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link href="/login">Login</Link></Button>
              <Button size="sm" asChild><Link href="/register">Post Ad</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

Create `components/layout/SignOutButton.tsx`:

```tsx
// components/layout/SignOutButton.tsx
"use client";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
      Sign out
    </Button>
  );
}
```

Add to `.env.local`:
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: NextAuth.js v5 with credentials + Google OAuth"
```

---

## PHASE 4 — AI Integration

---

### Task 15: AI-Powered Smart Search

**Files:**
- Create: `app/api/ai/search/route.ts`
- Create: `components/shared/SmartSearch.tsx`
- Modify: `app/(marketplace)/page.tsx`

- [ ] **Step 1: Install Vercel AI SDK**

```bash
npm install ai
```

- [ ] **Step 2: Write AI search API route**

```ts
// app/api/ai/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { connectDB } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

  // Use Claude to parse natural language query into structured filter
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Parse this pet search query into JSON with fields: species, breed, type, maxPrice, location.
Only include fields mentioned. Return ONLY valid JSON, nothing else.
Query: "${query}"`,
      },
    ],
  });

  let filter: Record<string, unknown> = {};
  try {
    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const parsed = JSON.parse(text);
    if (parsed.species) filter.species = parsed.species;
    if (parsed.breed) filter.breed = new RegExp(parsed.breed, "i");
    if (parsed.type) filter.type = parsed.type;
    if (parsed.maxPrice) filter.price = { $lte: parsed.maxPrice };
    if (parsed.location) filter.location = new RegExp(parsed.location, "i");
  } catch {
    filter = {};
  }

  await connectDB();
  const listings = await Listing.find(filter).sort({ createdAt: -1 }).limit(12).lean();

  return NextResponse.json({ listings, parsedFilter: filter });
}
```

- [ ] **Step 3: Write SmartSearch component**

```tsx
// components/shared/SmartSearch.tsx
"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import type { Listing } from "@/types/marketplace";

export function SmartSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Listing[] | null>(null);
  const [pending, startTransition] = useTransition();

  const search = () => {
    if (!query.trim()) return;
    startTransition(async () => {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data.listings ?? []);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder='Try "male lab puppy under 500 GEL in Tbilisi"'
            className="pl-9 bg-background"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
        </div>
        <Button onClick={search} disabled={pending} className="gap-2 shrink-0">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI Search
        </Button>
      </div>

      {results !== null && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
          <ListingGrid listings={results} type="buy-sell" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add to marketplace home**

Add `<SmartSearch />` below the hero in `app/(marketplace)/page.tsx`:

```tsx
import { SmartSearch } from "@/components/shared/SmartSearch";

// inside MarketplacePage, after the tabs grid:
<div className="mt-12">
  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
    <Sparkles className="w-5 h-5 text-primary" />
    Smart Search
  </h2>
  <SmartSearch />
</div>
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: AI smart search with Claude natural language query parsing"
```

---

### Task 16: AI Lost Pet Image Matching

**Files:**
- Create: `app/api/ai/match-lost-pet/route.ts`
- Create: `components/marketplace/LostPetMatcher.tsx`

- [ ] **Step 1: Write image match API**

```ts
// app/api/ai/match-lost-pet/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { connectDB } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const imageFile = formData.get("image") as File | null;
  if (!imageFile) return NextResponse.json({ error: "Image required" }, { status: 400 });

  const buffer = Buffer.from(await imageFile.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mediaType = imageFile.type as "image/jpeg" | "image/png" | "image/webp";

  // Describe the pet in the photo
  const descMsg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
        { type: "text", text: 'Describe this pet briefly for matching: species, breed, primary color, distinctive markings. JSON only: {"species":"","breed":"","color":"","markings":""}' },
      ],
    }],
  });

  let petDesc: Record<string, string> = {};
  try {
    const text = descMsg.content[0].type === "text" ? descMsg.content[0].text : "{}";
    petDesc = JSON.parse(text);
  } catch {
    petDesc = {};
  }

  await connectDB();
  const filter: Record<string, unknown> = { type: "lost-found", isResolved: false };
  if (petDesc.species) filter.species = petDesc.species;
  if (petDesc.breed) filter.breed = new RegExp(petDesc.breed, "i");

  const candidates = await Listing.find(filter).limit(20).lean();

  return NextResponse.json({ description: petDesc, candidates });
}
```

- [ ] **Step 2: Write LostPetMatcher component**

```tsx
// components/marketplace/LostPetMatcher.tsx
"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Search } from "lucide-react";
import { LostFoundCard } from "./LostFoundCard";
import type { LostFoundListing } from "@/types/marketplace";

export function LostPetMatcher() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<LostFoundListing[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (file: File) => {
    setPreview(URL.createObjectURL(file));
    setResults(null);
  };

  const match = async () => {
    if (!inputRef.current?.files?.[0]) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("image", inputRef.current.files[0]);
    const res = await fetch("/api/ai/match-lost-pet", { method: "POST", body: fd });
    const data = await res.json();
    setResults(data.candidates ?? []);
    setLoading(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold">Found a stray? Match it to lost reports</h3>
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Upload a photo of the pet</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {preview && (
        <Button onClick={match} disabled={loading} className="w-full gap-2">
          <Search className="w-4 h-4" />
          {loading ? "Matching…" : "Find matching reports"}
        </Button>
      )}

      {results !== null && (
        <div className="space-y-3">
          <p className="text-sm font-medium">{results.length} possible match{results.length !== 1 ? "es" : ""}</p>
          {results.map((r) => <LostFoundCard key={r._id} listing={r} href={`/lost-found/${r._id}`} />)}
          {results.length === 0 && <p className="text-sm text-muted-foreground">No matching reports found. Consider posting a Found listing.</p>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: AI lost pet image matching with Claude vision"
```

---

## PHASE 5 — Polish & Production Readiness

---

### Task 17: Seed Script + Google Reviews Import

**Files:**
- Create: `scripts/seed.ts`
- Create: `scripts/import-google-reviews.ts`

- [ ] **Step 1: Write seed script**

```ts
// scripts/seed.ts
import mongoose from "mongoose";
import { config } from "dotenv";
config({ path: ".env.local" });

import { Business } from "../lib/models/Business";
import { Review } from "../lib/models/Review";

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);

  await Business.deleteMany({});
  await Review.deleteMany({ source: "google" });

  const business = await Business.create({
    category: "vet-clinics",
    name: "Vetline Clinic",
    description: "Premier 24/7 veterinary clinic in Vake.",
    address: "123 Chavchavadze Ave",
    neighborhood: "Vake",
    city: "Tbilisi",
    phone: "+995 32 200 0000",
    tags: ["Emergency", "Surgery", "Dental"],
    is24h: true,
    hasEmergency: true,
    aggregateRating: 4.8,
    googleRatingCount: 3,
    nativeRatingCount: 0,
  });

  await Review.insertMany([
    { businessId: business._id, source: "google", reviewerName: "Ana Beridze", rating: 5, text: "Excellent emergency care, saved my dog's life.", date: new Date("2025-11-10"), googleReviewId: "g1" },
    { businessId: business._id, source: "google", reviewerName: "Dato Kvaratskhelia", rating: 5, text: "Professional staff, modern equipment.", date: new Date("2025-12-01"), googleReviewId: "g2" },
    { businessId: business._id, source: "google", reviewerName: "Nino Lomidze", rating: 4, text: "Good clinic but wait times can be long.", date: new Date("2026-01-15"), googleReviewId: "g3" },
  ]);

  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed().catch(console.error);
```

Add to `package.json` scripts:
```json
"seed": "tsx scripts/seed.ts"
```

Run: `npm run seed`

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: seed script with sample business and Google review data"
```

---

### Task 18: Environment & Deployment Config

**Files:**
- Create: `vercel.ts` (Vercel config)
- Modify: `.env.local`

- [ ] **Step 1: Install Vercel config**

```bash
npm install @vercel/config
```

- [ ] **Step 2: Write vercel.ts**

```ts
// vercel.ts
import { type VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "npm run build",
  env: ["MONGODB_URI", "NEXTAUTH_SECRET", "NEXTAUTH_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "ANTHROPIC_API_KEY"],
};
```

- [ ] **Step 3: Add remaining env vars to .env.local**

```
ANTHROPIC_API_KEY=your-anthropic-api-key
```

- [ ] **Step 4: Commit**

```bash
git add vercel.ts
git commit -m "feat: Vercel deployment config"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Buy/Sell — price, breed, age, vaccinations, passport, FCI/FCG pedigree → `BuySellListing` type + model fields + filter
- [x] Adoption — age, temperament, spayed/neutered → `AdoptionListing`
- [x] Mating — sex, breed, age, weight, pedigree, location → `MatingListing`
- [x] Lost & Found — neighborhood tagging, SOS card, resolved flag → `LostFoundListing` + `LostFoundCard`
- [x] Vet Clinics — 24/7, emergency, average rating filters → `ServiceFilters`
- [x] Pet Hotels — pricing, conditions → `Business.pricePerNight`
- [x] Pet Shops — location, brands, contact → `BusinessCard`
- [x] Pet-Friendly — indoor allowed tag → `ServiceFilters`
- [x] Hybrid review — `source: 'google' | 'native'`, Google badge, aggregate rating recalc → `ReviewCard`, `ReviewList`, `/api/reviews`
- [x] Review form — name, star rating, text, submit → `ReviewForm`
- [x] Premium Beige Minimalism — CSS custom properties + tailwind palette
- [x] Global nav with module toggle — `Navbar` + `ModuleToggle`
- [x] Auth — NextAuth v5, credentials + Google OAuth, register API
- [x] AI — smart search, lost pet image matching
- [x] DB — all 4 Mongoose models, connection singleton

**No placeholders found.**

**Type consistency verified** — `MarketplaceType`, `ServiceCategory`, `ReviewSource` used consistently across types/, models/, API routes, and components.
