# Fullscreen Lightbox Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline listing-detail photo gallery with a client `Gallery` component that opens a fullscreen Radix-Dialog lightbox supporting arrow nav, swipe, keyboard, and pinch/double-tap zoom.

**Architecture:** New `"use client"` component `Gallery.tsx` owns the main-image + thumbnail markup (moved from the server page) and the lightbox. The server page passes `images`, `alt`, and the badge overlays as a `children` slot, staying a server component.

**Tech Stack:** Next.js 16.2.7 App Router, React 19.2, Tailwind 3.4, `@radix-ui/react-dialog` 1.1, `next/image`, `lucide-react`.

## Global Constraints

- No new npm dependencies — build on existing Radix Dialog.
- Local machine cannot run `next dev` / `next build` (OOM). Verify with `npx tsc --noEmit` and Vercel deploy only.
- Match existing Scandinavian aesthetic: frosted controls `bg-white/10 hover:bg-white/20 backdrop-blur-sm`, `rounded-full`, white icons, color tokens `#0E4A5C` / `#0F2830` / `#EBF6FA`.
- Respect `prefers-reduced-motion`.
- `listing.images` is `string[]`, up to 5 entries; may be empty.
- No frontend test runner exists in the repo; do not add one. Verification is type-check + deploy.

---

### Task 1: Create the `Gallery` client component (closed state + lightbox shell)

**Files:**
- Create: `app/(marketplace)/listings/[id]/Gallery.tsx`

**Interfaces:**
- Produces: `export default function Gallery({ images, alt, children }: { images: string[]; alt: string; children?: React.ReactNode }): JSX.Element`
  - Renders the closed-state main image (16/9) + thumbnail strip.
  - `children` is rendered as an absolute overlay on the main image (badge slot).
  - Clicking main image or a thumbnail opens a fullscreen Radix Dialog at that index.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function Gallery({
  images,
  alt,
  children,
}: {
  images: string[];
  alt: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const hasImages = images.length > 0;
  const multiple = images.length > 1;

  const openAt = useCallback((i: number) => {
    setIndex(i);
    setOpen(true);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + images.length) % images.length);
    },
    [images.length]
  );

  return (
    <>
      {/* Main image */}
      <div className="relative aspect-[16/9] bg-stone-100">
        {hasImages ? (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="absolute inset-0 w-full h-full cursor-zoom-in"
            aria-label="Open photo in fullscreen"
          >
            <Image
              src={images[0]}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🐾
          </div>
        )}
        {children}
      </div>

      {/* Thumbnail strip */}
      {multiple && (
        <div className="flex gap-2 p-4 overflow-x-auto">
          {images.slice(1).map((src, i) => (
            <button
              type="button"
              key={i}
              onClick={() => openAt(i + 1)}
              className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]"
              aria-label={`Open photo ${i + 2} in fullscreen`}
            >
              <Image
                src={src}
                alt={`${alt} photo ${i + 2}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {hasImages && (
        <Lightbox
          images={images}
          alt={alt}
          index={index}
          setIndex={setIndex}
          open={open}
          onOpenChange={setOpen}
          go={go}
          multiple={multiple}
        />
      )}
    </>
  );
}
```

(The `Lightbox` component is added in Task 2 in the same file, below `Gallery`.)

- [ ] **Step 2: Type-check (will fail until Task 2 adds `Lightbox`)**

Run: `npx tsc --noEmit`
Expected: error `Cannot find name 'Lightbox'` — expected, resolved in Task 2. Do not commit yet.

---

### Task 2: Add the `Lightbox` (nav + swipe + keyboard + zoom) in the same file

**Files:**
- Modify: `app/(marketplace)/listings/[id]/Gallery.tsx` (append `Lightbox` component)

**Interfaces:**
- Consumes from Task 1: called as
  `<Lightbox images={string[]} alt={string} index={number} setIndex={(n:number)=>void} open={boolean} onOpenChange={(b:boolean)=>void} go={(dir:1|-1)=>void} multiple={boolean} />`
- Produces: internal component, not exported.

- [ ] **Step 1: Append the `Lightbox` component and helpers**

```tsx
function Lightbox({
  images,
  alt,
  index,
  setIndex,
  open,
  onOpenChange,
  go,
  multiple,
}: {
  images: string[];
  alt: string;
  index: number;
  setIndex: (n: number) => void;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  go: (dir: 1 | -1) => void;
  multiple: boolean;
}) {
  // Zoom + pan state for the active image.
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  // Gesture bookkeeping (refs so handlers stay stable, no re-render churn).
  const touchStartX = useRef(0);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      resetZoom();
      go(dir);
    },
    [go, resetZoom]
  );

  // Reset zoom whenever the visible image changes.
  useEffect(() => {
    resetZoom();
  }, [index, resetZoom]);

  // Keyboard arrows (Radix handles Esc + focus trap + scroll lock).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!multiple) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, multiple, step]);

  const dist = (t: TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStartDist.current = dist(e.touches);
      pinchStartScale.current = scale;
    } else if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      if (scale > 1) {
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
      }
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const ratio = dist(e.touches) / (pinchStartDist.current || 1);
      setScale(Math.min(4, Math.max(1, pinchStartScale.current * ratio)));
    } else if (e.touches.length === 1 && scale > 1 && panStart.current) {
      setTx(panStart.current.tx + (e.touches[0].clientX - panStart.current.x));
      setTy(panStart.current.ty + (e.touches[0].clientY - panStart.current.y));
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    panStart.current = null;
    if (scale > 1) return; // zoomed: don't treat as swipe
    if (!multiple) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  };

  const toggleZoom = () => {
    if (scale > 1) resetZoom();
    else setScale(2.5);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-0 z-50 w-screen h-screen border-0 bg-transparent p-0 outline-none flex items-center justify-center"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">{alt} — photo viewer</Dialog.Title>

          {/* Close */}
          <Dialog.Close
            className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Dialog.Close>

          {/* Image */}
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onDoubleClick={toggleZoom}
          >
            <div
              className="relative w-full h-full max-w-5xl motion-safe:transition-transform"
              style={{
                transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                cursor: scale > 1 ? "grab" : "zoom-in",
              }}
            >
              <Image
                src={images[index]}
                alt={`${alt} photo ${index + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>

          {/* Arrows */}
          {multiple && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Counter */}
          {multiple && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm">
              {index + 1} / {images.length}
            </div>
          )}

          {/* Thumbnail strip */}
          {multiple && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-sm max-w-[90vw] overflow-x-auto">
              {images.map((src, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  className={`relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden transition-opacity ${
                    i === index ? "ring-2 ring-white opacity-100" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add "app/(marketplace)/listings/[id]/Gallery.tsx"
git commit -m "feat(gallery): fullscreen lightbox component with zoom, swipe, arrow nav"
```

---

### Task 3: Wire `Gallery` into the server page

**Files:**
- Modify: `app/(marketplace)/listings/[id]/page.tsx` (import + replace lines ~78–130)

**Interfaces:**
- Consumes: `Gallery` default export from Task 1/2.

- [ ] **Step 1: Add the import**

At the top of the file, after the existing component imports (near line 11–12):

```tsx
import Gallery from "./Gallery";
```

- [ ] **Step 2: Replace the inline gallery markup**

Replace the entire block from `{/* Image gallery */}` (the `<div className="relative aspect-[16/9] ...">`) through the end of the `{/* Extra images */}` block (currently lines ~78–130) with:

```tsx
{/* Image gallery */}
<Gallery images={listing.images} alt={listing.breed}>
  <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-[#0F2830]">
      {typeLabels[listing.type]}
    </span>
    {vip && (
      <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black text-amber-600">
        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
        VIP
      </span>
    )}
  </div>
  {listing.type === "buy-sell" && (
    <div className="absolute bottom-3 right-3 pointer-events-none bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-base font-bold text-[#0F2830]">
      {listing.currency === "USD"
        ? `$${listing.price.toLocaleString()}`
        : `${listing.price.toLocaleString()} ₾`}
    </div>
  )}
  {listing.type === "mating" && listing.price !== null && (
    <div className="absolute bottom-3 right-3 pointer-events-none bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-base font-bold text-[#0F2830]">
      {listing.price.toLocaleString()} ₾
    </div>
  )}
</Gallery>
```

Note: `pointer-events-none` on overlays so clicks fall through to the image button beneath. The `Image` import in page.tsx may become unused — remove it if so (Step 3 catches it).

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS. If it flags `Image` as unused (lint) or any type error, remove the now-unused `import Image from "next/image";` line from page.tsx.

- [ ] **Step 4: Commit**

```bash
git add "app/(marketplace)/listings/[id]/page.tsx"
git commit -m "feat(gallery): wire Gallery lightbox into listing detail page"
```

---

### Task 4: Verify on deploy

**Files:** none.

- [ ] **Step 1: Final type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 2: Push to main (per user preference)**

```bash
git push origin main
```

- [ ] **Step 3: Manual verification on the Vercel deploy**

On a listing with 5 photos, confirm:
- Click main image → fullscreen lightbox opens.
- Click a thumbnail → lightbox opens at that photo.
- Arrows + ←/→ keys cycle photos; wraps at ends.
- Bottom thumbnail strip jumps to photo; active thumb ringed.
- Counter shows `n / 5`.
- Mobile: swipe left/right changes photo; pinch zooms; double-tap toggles zoom; drag pans while zoomed.
- X button and Esc close.
- Single-photo listing: no arrows/counter/strip, still opens.

---

## Self-Review

- **Spec coverage:** Fullscreen lightbox (Task 1/2 ✓), arrow nav + swipe + keyboard (Task 2 ✓), pinch + double-tap zoom + pan (Task 2 ✓), dark overlay + close X (Task 2 ✓), badge overlays preserved (Task 3 ✓), thumbnail strip (Task 1 closed + Task 2 in-lightbox ✓), edge cases 0/1 image (Task 1/2 guards ✓).
- **Placeholders:** none — full code in every step.
- **Type consistency:** `Gallery` props `{images, alt, children}` consistent across Tasks 1 & 3; `Lightbox` prop signature consistent between call site (Task 1) and definition (Task 2); `go`/`step`/`resetZoom` names consistent within Task 2.
