"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

export default function LoginPage() {
  const { t } = useT();
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

    if (result?.error) {
      setLoading(false);
      setError(t.auth.login.invalidCredentials);
      return;
    }

    // Full-document navigation (not router.push) on success. A client-side
    // transition keeps Next's Router Cache, which may hold a prefetch of a
    // proxy-protected route (e.g. /listings/new) captured *while logged out* —
    // i.e. a cached redirect to /login. Replaying that stale entry bounces a
    // freshly-authenticated user back to login until they hard-refresh. A full
    // load discards that cache and carries the new session cookie. Honour the
    // proxy's `callbackUrl`, but only same-origin relative paths (no open
    // redirect).
    const raw = new URLSearchParams(window.location.search).get("callbackUrl");
    const target = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
    window.location.assign(target);
  }

  return (
    <div className="min-h-screen bg-[#EBF6FA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm p-8 space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#0E4A5C] flex items-center justify-center">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-[#0F2830]">{t.auth.login.title}</h1>
              <p className="text-stone-500 text-sm mt-1">{t.auth.login.subtitle}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#0F2830]">{t.auth.emailLabel}</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-[#EBF6FA]/50 text-[#0F2830] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/30 focus:border-[#0E4A5C] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[#0F2830]">{t.auth.passwordLabel}</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-[#EBF6FA]/50 text-[#0F2830] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/30 focus:border-[#0E4A5C] transition-all"
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
              className="w-full bg-[#0E4A5C] text-white py-3.5 rounded-xl font-semibold text-base hover:bg-[#0B3D4E] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? t.auth.loading : t.auth.login.submit}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-stone-400">{t.auth.or}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 border border-stone-200 bg-white text-[#0F2830] py-3.5 rounded-xl font-semibold text-base hover:bg-stone-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t.auth.login.google}
          </button>

          <p className="text-center text-sm text-stone-500">
            {t.auth.login.noAccount}{" "}
            <Link href="/register" className="text-[#0E4A5C] font-semibold hover:underline">
              {t.auth.login.registerLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
