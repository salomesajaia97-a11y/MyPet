"use client";

import { Star } from "lucide-react";
import { useState } from "react";

// Read-only star row.
export function Stars({ value, className = "w-4 h-4" }: { value: number; className?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${className} ${
            n <= value ? "fill-amber-400 text-amber-400" : "text-stone-300"
          }`}
        />
      ))}
    </div>
  );
}

// Interactive star picker used by the review form.
export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} ვარსკვლავი`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              n <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-stone-300 hover:text-amber-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
