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
