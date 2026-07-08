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
              preload
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

  const jumpTo = useCallback(
    (i: number) => {
      resetZoom();
      setIndex(i);
    },
    [resetZoom, setIndex]
  );

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

  const dist = (t: React.TouchList) =>
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
                loading="eager"
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
                  onClick={() => jumpTo(i)}
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
