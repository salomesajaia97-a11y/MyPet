"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { mergeMessages } from "@/lib/messages/paging";

interface Msg {
  _id: string;
  body: string;
  createdAt: string;
  mine: boolean;
}
interface ThreadInfo {
  _id: string;
  listingId: string;
  listingTitle: string;
  // False once the listing has been deleted — the conversation stays, the link
  // to the listing does not.
  listingExists: boolean;
}

export default function ThreadPage() {
  const { t } = useT();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [thread, setThread] = useState<ThreadInfo | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // The API returns one bounded window of messages; `hasOlder` says whether
  // there is history behind it to fetch.
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Set before prepending an earlier page so the scroll effect below leaves the
  // reader where they are instead of throwing them back to the newest message.
  const skipAutoScroll = useRef(false);

  const fetchThread = useCallback(
    async (
      before?: string
    ): Promise<{ thread: ThreadInfo; messages: Msg[]; hasMore: boolean } | null | "error"> => {
      try {
        const url = before
          ? `/api/messages/${id}?before=${encodeURIComponent(before)}`
          : `/api/messages/${id}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.status === 404 || res.status === 403) return "error";
        if (!res.ok) return null;
        const d = await res.json();
        return { thread: d.thread, messages: d.messages ?? [], hasMore: !!d.hasMore };
      } catch {
        return null;
      }
    },
    [id]
  );

  const loadOlder = async () => {
    const cursor = messages[0]?._id;
    if (!cursor || loadingOlder) return;
    setLoadingOlder(true);
    const d = await fetchThread(cursor);
    if (d && d !== "error") {
      skipAutoScroll.current = true;
      setMessages((prev) => mergeMessages(d.messages, prev));
      setHasOlder(d.hasMore);
    }
    setLoadingOlder(false);
  };

  // Initial load.
  useEffect(() => {
    let active = true;
    (async () => {
      const d = await fetchThread();
      if (!active) return;
      if (d === "error") setNotFound(true);
      else if (d) {
        setThread(d.thread);
        setMessages(d.messages);
        setHasOlder(d.hasMore);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [fetchThread]);

  // Poll for new messages every 5s. Skip once the thread is gone (404/403) so
  // we don't hammer the API. The poll returns only the newest window, so merge
  // rather than replace — a reader who loaded earlier pages must not lose them.
  // Only replace state when the merge actually changed something (the merge is
  // a superset of what we hold, so equal length + same last id means equal);
  // otherwise every poll makes a new array reference and the scroll effect
  // below yanks the user to the bottom mid-read.
  useEffect(() => {
    if (notFound) return;
    const interval = setInterval(async () => {
      const d = await fetchThread();
      if (d && d !== "error") {
        setMessages((prev) => {
          const merged = mergeMessages(prev, d.messages);
          return merged.length === prev.length &&
            merged[merged.length - 1]?._id === prev[prev.length - 1]?._id
            ? prev
            : merged;
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchThread, notFound]);

  useEffect(() => {
    if (skipAutoScroll.current) {
      skipAutoScroll.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setBody("");
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        const d = await fetchThread();
        if (d && d !== "error") setMessages((prev) => mergeMessages(prev, d.messages));
      } else {
        setBody(text); // restore on failure
      }
    } catch {
      setBody(text);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#EBF6FA] flex items-center justify-center text-stone-400 text-sm">{t.profile.messages.loading}</div>;
  }
  if (notFound || !thread) {
    return (
      <div className="min-h-screen bg-[#EBF6FA] flex flex-col items-center justify-center gap-3">
        <p className="text-stone-600">{t.profile.messages.notFound}</p>
        <Link href="/profile/messages" className="text-sm text-[#0E4A5C] font-semibold">{t.common.actions.back}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBF6FA] flex flex-col">
      <div className="max-w-2xl w-full mx-auto px-4 py-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
          <Link href="/profile/messages" className="text-stone-500 hover:text-[#0E4A5C]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <p className="font-semibold text-[#0F2830] truncate">{thread.listingTitle}</p>
            {thread.listingExists ? (
              <Link href={`/listings/${thread.listingId}`} className="text-xs text-[#0E4A5C] hover:underline">
                {t.profile.messages.viewListing}
              </Link>
            ) : (
              <p className="text-xs text-stone-400">{t.profile.messages.listingRemoved}</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {hasOlder && (
            <div className="pb-2 text-center">
              <button
                type="button"
                onClick={loadOlder}
                disabled={loadingOlder}
                className="text-xs font-semibold text-[#0E4A5C] hover:underline disabled:opacity-60"
              >
                {loadingOlder ? t.profile.messages.loading : t.profile.messages.loadEarlier}
              </button>
            </div>
          )}
          {messages.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-8">{t.profile.messages.noMessages}</p>
          ) : (
            messages.map((m) => (
              <div key={m._id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    m.mine
                      ? "bg-[#0E4A5C] text-white rounded-br-sm"
                      : "bg-white text-[#0F2830] rounded-bl-sm shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        <form onSubmit={send} className="flex items-center gap-2 pt-3 border-t border-stone-200">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t.profile.messages.inputPlaceholder}
            maxLength={2000}
            className="flex-1 rounded-full border border-stone-200 px-4 py-2.5 text-sm text-[#0F2830] focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/30"
          />
          <button
            type="submit"
            disabled={sending || body.trim().length < 1}
            aria-label={t.profile.messages.send}
            className="shrink-0 w-11 h-11 rounded-full bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white flex items-center justify-center transition-colors disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
