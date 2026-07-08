import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Send, MessageCircle } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerDictionary();
  return {
    title: t.pages.contact.metaTitle,
    description: t.pages.contact.metaDescription,
  };
}

const CHANNELS = [
  {
    label: "Email",
    value: "info@mypet.ge",
    href: "mailto:info@mypet.ge",
    Icon: Mail,
  },
  {
    label: "Telegram",
    value: "@mypetge",
    href: "https://t.me/mypetge",
    Icon: Send,
  },
  {
    label: "Messenger",
    value: "MyPet.ge",
    href: "#",
    Icon: MessageCircle,
  },
];

export default async function ContactPage() {
  const { t } = await getServerDictionary();
  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-black text-[#0F2830] mb-2">
          {t.pages.contact.title}
        </h1>
        <p className="text-stone-500 text-sm mb-8">
          {t.pages.contact.subtitle}
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {CHANNELS.map(({ label, value, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col items-start gap-3 hover:border-[#0E4A5C]/40 transition-colors"
            >
              <span className="w-10 h-10 flex items-center justify-center rounded-full border border-stone-200 text-[#0E4A5C]">
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                {label}
              </span>
              <span className="text-sm text-stone-700 font-medium">{value}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
