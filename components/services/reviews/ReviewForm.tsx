"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { StarPicker } from "./Stars";
import type { ReviewDraft } from "./types";
import { useT } from "@/components/i18n/LanguageProvider";

const MAX_PHOTOS = 3;

interface Props {
  initial?: Partial<ReviewDraft>;
  submitLabel: string;
  onSubmit: (draft: ReviewDraft) => Promise<void>;
  onCancel?: () => void;
}

// Create/edit form: star picker (required), optional comment, up to 3 photos.
// Submit is enabled once a rating is chosen — a star-only review is valid.
export default function ReviewForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const { t } = useT();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [text, setText] = useState(initial?.text ?? "");
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: FileList) => {
    setError("");
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return;
    const chosen = Array.from(files).slice(0, room);
    setUploading(true);
    try {
      for (const file of chosen) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "upload failed");
        }
        const { url } = await res.json();
        setPhotos((prev) => (prev.length < MAX_PHOTOS ? [...prev, url] : prev));
      }
    } catch {
      setError(t.services.reviews.form.uploadFailed);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(t.services.reviews.form.chooseRating);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ rating, text: text.trim(), photos });
      if (!initial) {
        setRating(0);
        setText("");
        setPhotos([]);
      }
    } catch {
      setError(t.services.reviews.form.submitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <StarPicker value={rating} onChange={setRating} />

      <textarea
        rows={4}
        placeholder={t.services.reviews.form.commentPlaceholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-xl border border-stone-200 p-3 text-sm text-[#0F2830] resize-none focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/30"
      />

      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((url) => (
            <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((p) => p !== url))}
                className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                aria-label={t.common.actions.delete}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 text-sm text-[#0E4A5C] font-medium hover:underline disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {t.services.reviews.form.addPhoto}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="flex-1 bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
        >
          {submitting ? t.services.reviews.form.submitting : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors"
          >
            {t.common.actions.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
