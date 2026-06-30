"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated number that counts up from 0 to `end` the first time it scrolls
 * into view. Used for the stats bar to make the figures feel alive.
 */
export function CountUp({
  end,
  suffix = "",
  duration = 1700,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      setValue(end);
      return;
    }

    let frame = 0;
    let startTime = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const tick = (now: number) => {
          if (!startTime) startTime = now;
          const progress = Math.min((now - startTime) / duration, 1);
          // easeOutExpo for a snappy, settling count
          const eased =
            progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setValue(Math.round(eased * end));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [end, duration]);

  return (
    <span ref={ref}>
      {value.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
