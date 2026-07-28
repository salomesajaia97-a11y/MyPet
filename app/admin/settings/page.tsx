"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { VIP_TIERS, formatGel, type VipTier } from "@/lib/marketplace/vipPackages";

interface Settings {
  vip: Record<VipTier, { amount: number; days: number }>;
  flags: { aiSearch: boolean; payments: boolean; registration: boolean };
}

type FlagName = keyof Settings["flags"];

const FLAGS: FlagName[] = ["payments", "aiSearch", "registration"];

export default function AdminSettingsPage() {
  const { t } = useT();
  const { notify } = useConfirm();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.vip) setSettings({ vip: d.vip, flags: d.flags });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setSettings({ vip: data.vip, flags: data.flags });
      setSaved(true);
    } catch {
      await notify({ description: t.admin.settings.error });
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <p className="text-gray-500">{t.admin.settings.loading}</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.admin.settings.title}</h1>
      <p className="text-sm text-gray-500 mb-6">{t.admin.settings.subtitle}</p>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">{t.admin.settings.pricesTitle}</h2>
        <p className="mt-1 text-xs text-gray-500">{t.admin.settings.pricesNote}</p>

        <div className="mt-4 space-y-3">
          {VIP_TIERS.map((tier) => (
            <div key={tier} className="flex flex-wrap items-center gap-3">
              <span className="w-24 text-sm font-semibold text-gray-700">
                {t.vip.tiers[tier].name}
              </span>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                {t.admin.settings.amount}
                {/* Stored in tetri, typed in tetri: showing lari here and
                    converting would invite a 100x mistake on a live price. */}
                <input
                  type="number"
                  min={1}
                  value={settings.vip[tier].amount}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      vip: {
                        ...settings.vip,
                        [tier]: { ...settings.vip[tier], amount: Number(e.target.value) },
                      },
                    })
                  }
                  className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900"
                />
                <span className="text-gray-400">
                  = {formatGel(settings.vip[tier].amount)} {t.vip.gel}
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                {t.admin.settings.days}
                <input
                  type="number"
                  min={1}
                  value={settings.vip[tier].days}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      vip: {
                        ...settings.vip,
                        [tier]: { ...settings.vip[tier], days: Number(e.target.value) },
                      },
                    })
                  }
                  className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">{t.admin.settings.flagsTitle}</h2>
        <p className="mt-1 text-xs text-gray-500">{t.admin.settings.flagsNote}</p>

        <div className="mt-4 space-y-3">
          {FLAGS.map((flag) => (
            <label key={flag} className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={settings.flags[flag]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    flags: { ...settings.flags, [flag]: e.target.checked },
                  })
                }
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-800">
                  {t.admin.settings.flagLabels[flag]}
                </span>
                <span className="block text-xs text-gray-500">
                  {t.admin.settings.flagHints[flag]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t.admin.settings.save}
        </button>
        {saved && (
          <span className="text-sm font-semibold text-emerald-600">{t.admin.settings.saved}</span>
        )}
      </div>
    </div>
  );
}
