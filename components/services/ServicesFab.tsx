import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";

/** Floating "add business" action shared across the services browse pages. */
export async function ServicesFab() {
  const { t } = await getServerDictionary();
  return (
    <Link
      href="/services/new"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 max-w-[calc(100vw-2rem)] flex items-center gap-2 bg-[#0E4A5C] text-white rounded-full shadow-lg px-4 sm:px-5 py-3 text-sm font-semibold hover:bg-[#0B3D4E] transition-colors z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E4A5C]"
    >
      {t.services.fab}
    </Link>
  );
}
