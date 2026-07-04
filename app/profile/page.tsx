"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRound } from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";

interface Account {
  name: string;
  email: string;
  image?: string;
  balance: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then(({ user }) => {
        if (!user) return;
        setAccount(user);
        setName(user.name ?? "");
        setAvatar(user.image ? [user.image] : []);
      })
      .catch(() => {});
  }, [status]);

  async function handleAvatarChange(urls: string[]) {
    setAvatar(urls);
    if (urls[0]) {
      await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urls[0] }),
      });
      await update();
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        await update();
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  const email = account?.email ?? session?.user?.email ?? "";
  const dirty = account !== null && name.trim() !== account.name && name.trim() !== "";

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#0F2830] mb-6">პროფილი</h1>

        <div className="bg-white rounded-2xl p-6 space-y-6 shadow-sm">
          {/* Avatar */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              პროფილის ფოტო
            </label>
            <div className="w-28">
              <ImageUploader value={avatar} onChange={handleAvatarChange} single />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">სახელი</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              placeholder="სახელი"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ელ. ფოსტა</label>
            <div className="flex items-center gap-2 w-full border border-stone-100 bg-stone-50 rounded-xl px-3 py-2.5 text-sm text-stone-500">
              <UserRound className="w-4 h-4 text-stone-400 shrink-0" />
              {email}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="py-2.5 px-5 bg-[#0E4A5C] text-white font-semibold rounded-xl hover:bg-[#0B3D4E] transition-colors disabled:opacity-50"
            >
              {saving ? "ინახება..." : "შენახვა"}
            </button>
            {saved && <span className="text-sm text-emerald-600">შენახულია ✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
