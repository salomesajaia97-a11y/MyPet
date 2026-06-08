"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { X, ImagePlus, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  single?: boolean;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

type SlotState = { url: string } | { uploading: true } | { error: string };

export function ImageUploader({
  value,
  onChange,
  maxImages = 5,
  single = false,
}: ImageUploaderProps) {
  const limit = single ? 1 : maxImages;
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<SlotState[]>(
    value.map((url) => ({ url }))
  );

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files).slice(0, limit - slots.filter(s => "url" in s || "uploading" in s).length);

    let offset = slots.length;
    for (const file of picked) {
      if (!ALLOWED.includes(file.type)) {
        setSlots((prev) => [...prev, { error: `${file.name}: only JPEG/PNG/WebP` }]);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setSlots((prev) => [...prev, { error: `${file.name}: max 5 MB` }]);
        continue;
      }

      const placeholderIndex = offset++;
      setSlots((prev) => {
        const next = [...prev];
        next[placeholderIndex] = { uploading: true };
        return next;
      });

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");

        setSlots((prev) => {
          const next = [...prev];
          next[placeholderIndex] = { url: json.url };
          const urls = next.filter((s): s is { url: string } => "url" in s).map((s) => s.url);
          onChange(urls);
          return next;
        });
      } catch (err) {
        setSlots((prev) => {
          const next = [...prev];
          next[placeholderIndex] = { error: err instanceof Error ? err.message : "Upload failed" };
          return next;
        });
      }
    }
  }

  function removeSlot(index: number) {
    setSlots((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const urls = next.filter((s): s is { url: string } => "url" in s).map((s) => s.url);
      onChange(urls);
      return next;
    });
  }

  const atLimit = slots.filter((s) => "url" in s || "uploading" in s).length >= limit;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {slots.map((slot, i) => (
          <div
            key={i}
            className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-50"
          >
            {"url" in slot ? (
              <>
                <Image src={slot.url} alt="upload" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : "uploading" in slot ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-1">
                <p className="text-[10px] text-red-500 text-center leading-tight">{slot.error}</p>
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="mt-1 text-[10px] text-stone-400 underline"
                >
                  remove
                </button>
              </div>
            )}
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 text-stone-400 hover:border-[#0E4A5C] hover:text-[#0E4A5C] transition-colors"
          >
            <ImagePlus className="w-6 h-6" />
            <span className="text-[11px] font-medium">ფოტო</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={!single}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="text-xs text-stone-400">
        მაქს. {limit} ფოტო • JPEG, PNG, WebP • 5 MB-მდე
      </p>
    </div>
  );
}
