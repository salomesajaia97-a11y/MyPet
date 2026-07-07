"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";

/**
 * Inline "send message to seller" box on a listing detail page. Rendered only
 * when the listing has an owner (userId). Logged-out users get a login prompt.
 */
export function ContactSellerBox({ listingId }: { listingId: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (status !== "authenticated") {
    return (
      <div className="border-t pt-5">
        <p className="text-sm text-stone-500">
          გამყიდველთან დასაკავშირებლად{" "}
          <Link href="/login" className="text-[#0E4A5C] font-semibold hover:underline">
            შედი სისტემაში
          </Link>
        </p>
      </div>
    );
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 1) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "failed");
      router.push(`/profile/messages/${data.threadId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "გაგზავნა ვერ მოხერხდა");
      setSending(false);
    }
  };

  return (
    <form onSubmit={send} className="border-t pt-5 space-y-3">
      <p className="text-sm font-semibold text-[#0F2830] flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-[#0E4A5C]" />
        მიწერე გამყიდველს
      </p>
      <textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="დაწერე შეტყობინება…"
        maxLength={2000}
        className="w-full rounded-xl border border-stone-200 p-3 text-sm text-[#0F2830] resize-none focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/30"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={sending || body.trim().length < 1}
        className="flex items-center justify-center gap-2 w-full bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {sending ? "იგზავნება…" : "გაგზავნა"}
      </button>
    </form>
  );
}
