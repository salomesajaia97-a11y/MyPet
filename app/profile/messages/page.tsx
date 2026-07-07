"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

interface ThreadItem {
  _id: string;
  listingId: string;
  listingTitle: string;
  lastMessageBody: string;
  lastMessageAt: string;
  otherName: string;
  otherImage: string | null;
  unread: number;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.round((now - then) / 60000);
  if (mins < 1) return "ახლახ";
  if (mins < 60) return `${mins} წთ`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} სთ`;
  return new Date(iso).toLocaleDateString("ka-GE", { day: "numeric", month: "short" });
}

export default function MessagesInboxPage() {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => (r.ok ? r.json() : { threads: [] }))
      .then((d) => setThreads(Array.isArray(d.threads) ? d.threads : []))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#0F2830] mb-6 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-[#0E4A5C]" />
          შეტყობინებები
        </h1>

        {loading ? (
          <p className="text-stone-400 text-sm text-center py-10">იტვირთება…</p>
        ) : threads.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center space-y-3">
            <div className="text-4xl">💬</div>
            <p className="text-stone-500 text-sm">ჯერ არ გაქვს შეტყობინებები.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((t) => (
              <Link
                key={t._id}
                href={`/profile/messages/${t._id}`}
                className="flex items-center gap-3 bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 shrink-0 rounded-full bg-[#0E4A5C]/10 text-[#0E4A5C] flex items-center justify-center font-semibold overflow-hidden">
                  {t.otherImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.otherImage} alt={t.otherName} className="w-full h-full object-cover" />
                  ) : (
                    t.otherName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[#0F2830] truncate">{t.otherName}</p>
                    <span className="text-xs text-stone-400 shrink-0">{timeAgo(t.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-stone-400 truncate">{t.listingTitle}</p>
                  <p className="text-sm text-stone-500 truncate">{t.lastMessageBody}</p>
                </div>
                {t.unread > 0 && (
                  <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-[#0E4A5C] text-white text-xs font-bold flex items-center justify-center">
                    {t.unread}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
