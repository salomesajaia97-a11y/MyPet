import Link from "next/link";
import { PAGE_SIZE } from "@/lib/marketplace/queries";
import { getServerDictionary } from "@/lib/i18n/server";

type Params = Record<string, string | string[] | undefined>;

/** Rebuild the current query string for a target page (drops empty values). */
function hrefFor(basePath: string, params: Params, page: number): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    const single = Array.isArray(value) ? value[0] : value;
    if (single) sp.set(key, single);
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

const base =
  "px-4 py-2 rounded-xl text-sm font-semibold border transition-colors";

/** Prev / next pager for the marketplace browse routes. Renders nothing when
 *  everything fits on one page. */
export async function Pager({
  basePath,
  params,
  page,
  total,
}: {
  basePath: string;
  params: Params;
  page: number;
  total: number;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const { t } = await getServerDictionary();

  return (
    <nav
      aria-label={t.marketplace.pagerLabel}
      className="flex items-center justify-center gap-3 pt-4"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(basePath, params, page - 1)}
          rel="prev"
          className={`${base} bg-white border-stone-200 text-[#0E4A5C] hover:border-[#0E4A5C]`}
        >
          ← {t.marketplace.prev}
        </Link>
      ) : (
        <span className={`${base} border-stone-200 text-stone-300`} aria-disabled="true">
          ← {t.marketplace.prev}
        </span>
      )}

      <span className="text-sm text-stone-500">
        {t.marketplace.page} {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={hrefFor(basePath, params, page + 1)}
          rel="next"
          className={`${base} bg-white border-stone-200 text-[#0E4A5C] hover:border-[#0E4A5C]`}
        >
          {t.marketplace.next} →
        </Link>
      ) : (
        <span className={`${base} border-stone-200 text-stone-300`} aria-disabled="true">
          {t.marketplace.next} →
        </span>
      )}
    </nav>
  );
}
