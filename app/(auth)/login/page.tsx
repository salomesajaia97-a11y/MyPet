"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PawPrint } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("არასწორი ელ-ფოსტა ან პაროლი");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm p-8 space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#6B5240] flex items-center justify-center">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-[#1C1917]">მოგესალმებით</h1>
              <p className="text-stone-500 text-sm mt-1">შედით თქვენს ანგარიშზე</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C1917]">ელ-ფოსტა</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-[#F5F0E8]/50 text-[#1C1917] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#6B5240]/30 focus:border-[#6B5240] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C1917]">პაროლი</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-[#F5F0E8]/50 text-[#1C1917] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#6B5240]/30 focus:border-[#6B5240] transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6B5240] text-white py-3.5 rounded-xl font-semibold text-base hover:bg-[#5a4435] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "მიმდინარეობს..." : "შესვლა"}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500">
            ანგარიში არ გაქვთ?{" "}
            <Link href="/register" className="text-[#6B5240] font-semibold hover:underline">
              რეგისტრაცია
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
