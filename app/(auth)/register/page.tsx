"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  PawPrint,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Heart,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

const inputClass =
  "w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 bg-[#EBF6FA]/50 text-[#0F2830] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/30 focus:border-[#0E4A5C] transition-all";
const iconClass =
  "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none";

/** 0–4, mirroring the 6-character minimum the API enforces. */
function scorePassword(v: string) {
  if (!v) return 0;
  let score = 0;
  if (v.length >= 6) score++;
  if (v.length >= 10) score++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
  if (/\d/.test(v) || /[^A-Za-z0-9]/.test(v)) score++;
  return Math.min(score, 4);
}

export default function RegisterPage() {
  const { t } = useT();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = scorePassword(password);
  const strengthLabels = [
    t.auth.register.strengthWeak,
    t.auth.register.strengthWeak,
    t.auth.register.strengthFair,
    t.auth.register.strengthGood,
    t.auth.register.strengthStrong,
  ];
  const strengthColors = ["bg-red-400", "bg-red-400", "bg-amber-400", "bg-lime-500", "bg-emerald-500"];
  const mismatch = confirm.length > 0 && password !== confirm;
  const matched = confirm.length > 0 && password === confirm;

  const benefits = [
    { icon: Sparkles, title: t.auth.register.benefit1Title, desc: t.auth.register.benefit1Desc },
    { icon: Heart, title: t.auth.register.benefit2Title, desc: t.auth.register.benefit2Desc },
    { icon: MessageCircle, title: t.auth.register.benefit3Title, desc: t.auth.register.benefit3Desc },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(t.auth.register.passwordMismatch);
      return;
    }

    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const email = form.get("email") as string;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t.auth.register.genericError);
      setLoading(false);
      return;
    }

    // Auto sign-in after registration. If it fails, send the user to the login
    // page rather than silently landing on "/" unauthenticated.
    const signInRes = await signIn("credentials", { email, password, redirect: false });
    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    // Full-document navigation, for the same reason the login page does it: a
    // client-side transition keeps Next's Router Cache, which can still hold a
    // prefetch of a proxy-protected route captured while logged out — i.e. a
    // cached redirect to /login. Replaying that bounces a user who has just
    // signed up straight back to the login form.
    window.location.assign("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EBF6FA] to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-3xl shadow-xl shadow-[#0E4A5C]/5 ring-1 ring-stone-100 overflow-hidden">
        {/* Brand panel — decoration only, so it stays out of the tab order. */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[#0E4A5C] via-[#0B3D4E] to-[#072B38] text-white overflow-hidden">
          <div aria-hidden className="absolute inset-0 opacity-[0.07]">
            <PawPrint className="absolute -top-6 -left-4 w-40 h-40 rotate-12" />
            <PawPrint className="absolute top-1/3 -right-10 w-52 h-52 -rotate-12" />
            <PawPrint className="absolute -bottom-10 left-1/4 w-44 h-44 rotate-45" />
          </div>

          <div className="relative">
            <div className="flex items-center gap-2.5">
              {/* On a white chip: the mark's own teal is close enough to the
                  panel gradient that unbacked it dissolves into it, which is
                  the same reason the social card backs it. */}
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center">
                <Image src="/logo.png" alt="" width={32} height={32} className="w-8 h-8" />
              </div>
              <span className="text-lg font-black tracking-tight">
                MyPet<span className="text-white/60">ge.online</span>
              </span>
            </div>

            <h2 className="mt-10 text-3xl font-black leading-tight">{t.auth.register.heroTitle}</h2>
            <p className="mt-3 text-white/70 leading-relaxed">{t.auth.register.heroSubtitle}</p>

            <ul className="mt-9 space-y-5">
              {benefits.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-3.5">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative mt-10 text-xs text-white/50">{t.auth.register.trust}</p>
        </div>

        {/* Form panel */}
        <div className="p-7 sm:p-10">
          {/* Mobile-only mark; the brand panel carries it from lg up. */}
          <Image
            src="/logo.png"
            alt=""
            width={48}
            height={48}
            priority
            className="lg:hidden w-12 h-12 mx-auto mb-4"
          />

          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-black text-[#0F2830]">{t.auth.register.title}</h1>
            <p className="text-stone-500 text-sm mt-1">{t.auth.register.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-[#0F2830]">
                {t.auth.register.nameLabel}
              </label>
              <div className="relative">
                <User className={iconClass} />
                <input id="name" name="name" type="text" required autoComplete="name" className={inputClass} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#0F2830]">
                {t.auth.emailLabel}
              </label>
              <div className="relative">
                <Mail className={iconClass} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[#0F2830]">
                {t.auth.passwordLabel}
              </label>
              <div className="relative">
                <Lock className={iconClass} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.auth.register.passwordPlaceholder}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t.auth.register.hidePassword : t.auth.register.showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-stone-400 hover:text-[#0E4A5C] hover:bg-stone-100 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password && (
                <div className="pt-1">
                  <div className="flex gap-1.5" aria-hidden>
                    {[1, 2, 3, 4].map((bar) => (
                      <span
                        key={bar}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          bar <= strength ? strengthColors[strength] : "bg-stone-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-stone-500">
                    {t.auth.register.strengthLabel}:{" "}
                    <span className="font-semibold text-[#0F2830]">{strengthLabels[strength]}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-[#0F2830]">
                {t.auth.register.confirmPasswordLabel}
              </label>
              <div className="relative">
                <Lock className={iconClass} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={mismatch}
                  className={`${inputClass} pr-12 ${
                    mismatch ? "border-red-300 bg-red-50/50 focus:ring-red-200 focus:border-red-400" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? t.auth.register.hidePassword : t.auth.register.showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-stone-400 hover:text-[#0E4A5C] hover:bg-stone-100 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {mismatch && <p className="text-xs text-red-600">{t.auth.register.passwordMismatch}</p>}
              {matched && (
                <p className="flex items-center gap-1 text-xs text-emerald-600">
                  <Check className="w-3.5 h-3.5" />
                  {t.auth.register.passwordsMatch}
                </p>
              )}
            </div>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || mismatch}
              className="w-full bg-[#0E4A5C] text-white py-3.5 rounded-xl font-semibold text-base hover:bg-[#0B3D4E] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? t.auth.loading : t.auth.register.submit}
            </button>
          </form>

          <div className="relative my-6">
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
            {t.auth.register.google}
          </button>

          <p className="mt-6 text-center text-xs text-stone-400 leading-relaxed">
            {t.auth.register.terms}{" "}
            <Link href="/terms" className="text-[#0E4A5C] font-semibold hover:underline">
              {t.auth.register.termsLink}
            </Link>{" "}
            {t.auth.register.and}{" "}
            <Link href="/privacy" className="text-[#0E4A5C] font-semibold hover:underline">
              {t.auth.register.privacyLink}
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-stone-500">
            {t.auth.register.haveAccount}{" "}
            <Link href="/login" className="text-[#0E4A5C] font-semibold hover:underline">
              {t.auth.register.loginLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
