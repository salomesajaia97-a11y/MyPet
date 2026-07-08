import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerDictionary();
  return {
    title: t.pages.about.metaTitle,
    description: t.pages.about.metaDescription,
  };
}

export default async function AboutPage() {
  const { t } = await getServerDictionary();
  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-black text-[#0F2830] mb-2">
          {t.pages.about.title}
        </h1>
        <p className="text-stone-500 text-sm mb-8">{t.pages.about.subtitle}</p>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-5 text-stone-600 leading-relaxed">
          {t.pages.about.paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
