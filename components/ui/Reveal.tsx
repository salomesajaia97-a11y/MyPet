"use client";

import { useEffect, useRef, useState } from "react";

type Direction = "up" | "left" | "right" | "scale";

const DIRECTION_CLASS: Record<Direction, string> = {
  up: "",
  left: "reveal-left",
  right: "reveal-right",
  scale: "reveal-scale",
};

/**
 * Scroll-triggered "slide-in" wrapper.
 *
 * Renders hidden (offset + transparent) until it scrolls into view, then
 * settles into place — giving each section/card a PowerPoint-style entrance.
 * Reveals once and stays put. Honors prefers-reduced-motion via globals.css.
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  direction?: Direction;
  /** Stagger delay in milliseconds */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Fire slightly before the element is fully on screen
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${DIRECTION_CLASS[direction]} ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
