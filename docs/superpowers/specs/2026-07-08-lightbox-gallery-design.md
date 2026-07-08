# Fullscreen Lightbox Gallery — Design

**Date:** 2026-07-08
**Scope:** Upgrade the pet photo gallery on the listing detail page with a fullscreen lightbox (zoom, arrow nav, swipe) while keeping the clean Scandinavian look.

## Context

- Listing detail page: `app/(marketplace)/listings/[id]/page.tsx` — a **server component**.
- Current gallery is inline markup (lines ~78–130): a 16/9 main image (`listing.images[0]`) with absolute-positioned badge overlays (type / VIP / price), plus a horizontal thumbnail strip for `listing.images.slice(1)`.
- `listing.images` holds up to 5 photos.
- Stack: Next.js 16.2.7 (App Router, Turbopack), React 19.2, Tailwind 3.4, Radix Dialog 1.1, lucide-react 1.17. No lightbox library.
- Constraint: local machine cannot run `next dev` / `next build` (OOM). Verify via `npx tsc --noEmit` + Vercel deploy.
- Decision: build **custom** on the repo's Radix `Dialog` (zero new deps). Zoom = **pinch (mobile) + double-tap/click 1x↔2.5x toggle + drag-pan when zoomed**.

## Architecture

New client component `app/(marketplace)/listings/[id]/Gallery.tsx` (`"use client"`).

- Owns the main-image + thumbnail-strip markup moved out of the server page.
- Props: `images: string[]`, `alt: string`, `overlay?: React.ReactNode` (slot for the existing badge overlays so the server page keeps rendering type/VIP/price).
- Server page stays a server component; it renders `<Gallery images alt>{badgeOverlays}</Gallery>` (overlays passed as children/slot).

## Components & Behavior

### Gallery (closed state)
- Main image: same `aspect-[16/9]` container, `next/image` `fill object-cover`, `priority`, `sizes`. Renders `overlay` slot on top.
- Thumbnail strip: unchanged look (`w-20 h-20` rounded frosted tiles, horizontal scroll). Shows all extra images.
- Clicking/tapping main image OR any thumbnail opens the lightbox at that index.
- Main image and thumbs are `<button>`s (keyboard + a11y). `cursor-zoom-in` on main.

### Lightbox (Radix Dialog)
- Overlay: `bg-black/90` (dark premium).
- Content: full-screen (`max-w-none w-screen h-screen`), transparent, borderless, no default padding.
- Close: `X` (lucide) top-right in a frosted circle (`bg-white/10 hover:bg-white/20 backdrop-blur-sm`), white icon. Radix provides Esc-close, focus trap, scroll lock.
- Current image centered, `object-contain`, `next/image` with `sizes="100vw"`.
- Counter pill `n / total` bottom-center, frosted. Hidden if 1 image.
- Optional in-lightbox thumbnail strip bottom, active thumb ringed. **Included.**

### Navigation
- Prev/Next arrow buttons (`ChevronLeft` / `ChevronRight`) left & right, frosted circles. Hidden when `images.length === 1`.
- Keyboard: ArrowLeft / ArrowRight step; Esc closes (Radix).
- Swipe: touch `touchstart`/`touchend` X-delta on the image container, threshold ~50px → prev/next. Disabled while zoomed (`scale > 1`) so drag pans instead.
- Navigation wraps around (last → first).

### Zoom
- State: `scale` (1–4) and `translate {x,y}` for the active image.
- Pinch: two-finger `touchmove`, distance ratio drives scale, clamped 1–4.
- Double-tap / double-click: toggle 1x ↔ 2.5x, centered on tap point.
- Single-finger drag (or mouse drag) pans when `scale > 1`.
- Switching image (arrow/swipe/thumb) resets scale=1, translate=0.
- Applied via `transform: scale() translate()` with transition (disabled mid-gesture).

## Aesthetics
- All controls: `rounded-full`, frosted `bg-white/10 hover:bg-white/20 backdrop-blur-sm`, white icons, smooth transitions — consistent with existing badge chips.
- Respect `prefers-reduced-motion` (no zoom/slide animation when set).
- Reuse existing color tokens where visible.

## Error / Edge Handling
- 0 images: page already shows the 🐾 placeholder; Gallery renders it, no lightbox trigger.
- 1 image: lightbox opens, arrows + counter + thumb strip hidden.
- Broken image URL: `next/image` default behavior (no extra handling).

## Testing / Verification
- `npx tsc --noEmit` — types clean.
- Push to Vercel; manual check on the production/preview deploy (desktop click+keyboard, mobile pinch/swipe). Cannot run dev locally (machine OOM).
