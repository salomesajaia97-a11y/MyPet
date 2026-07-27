import { describe, expect, it } from "vitest";
import {
  ADOPTION_KEYWORDS,
  BUY_SELL_KEYWORDS,
  buildKeywords,
  LOST_FOUND_KEYWORDS,
  SITE_KEYWORDS,
  VET_KEYWORDS,
} from "./keywords";
import { breadcrumbJsonLd, collectionPageJsonLd, graph, websiteJsonLd } from "./jsonLd";
import { browsePageMetadata, pageMetadata } from "./metadata";
import { SITE_URL } from "@/lib/siteUrl";

describe("buildKeywords", () => {
  it("drops duplicates case-insensitively and keeps first-seen order", () => {
    expect(buildKeywords(["Dog", "cat"], ["dog", "Bird"])).toEqual(["Dog", "cat", "Bird"]);
  });

  it("drops blanks and trims", () => {
    expect(buildKeywords(["  dog  ", "", "   "])).toEqual(["dog"]);
  });

  it("tolerates undefined groups", () => {
    expect(buildKeywords(undefined, ["dog"])).toEqual(["dog"]);
  });
});

describe("keyword corpus", () => {
  it("has no duplicates within the site-wide set", () => {
    const lower = SITE_KEYWORDS.map((k) => k.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it("covers the core Georgian head terms", () => {
    for (const term of [
      "შინაური ცხოველები",
      "ცხოველების განცხადებები",
      "ცხოველების ყიდვა გაყიდვა",
      "ძაღლის ყიდვა",
      "ვეტკლინიკა",
      "mypetge",
    ]) {
      expect(SITE_KEYWORDS).toContain(term);
    }
  });

  it("covers the Latin transliterations and their common misspellings", () => {
    expect(BUY_SELL_KEYWORDS).toContain("dzaglebis yidva gayidva");
    expect(BUY_SELL_KEYWORDS).toContain("zaglebis yidva");
    expect(ADOPTION_KEYWORDS).toContain("katebis gachukeba ufasod");
    expect(LOST_FOUND_KEYWORDS).toContain("dakarguli dzaglebi");
    expect(VET_KEYWORDS).toContain("veklat");
  });
});

describe("pageMetadata", () => {
  it("sets a canonical and an absolute og:url", () => {
    const meta = pageMetadata({
      locale: "ka",
      title: "T",
      description: "D",
      path: "/buy-sell",
    });
    expect(meta.alternates?.canonical).toBe("/buy-sell");
    expect(meta.openGraph?.url).toBe(`${SITE_URL}/buy-sell`);
  });

  // Nested metadata is merged shallowly, so defining `openGraph` at all drops
  // the root opengraph-image. Every page must restate the default card.
  it("falls back to the site OG card when the page has no image", () => {
    const meta = pageMetadata({ locale: "ka", title: "T", description: "D", path: "/" });
    expect(meta.openGraph).toMatchObject({
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
    });
    expect(meta.twitter).toMatchObject({ images: [`${SITE_URL}/opengraph-image`] });
  });

  it("uses the page's own images when it has them", () => {
    const meta = pageMetadata({
      locale: "en",
      title: "T",
      description: "D",
      path: "/listings/abc",
      images: ["https://cdn.example/1.jpg"],
    });
    expect(meta.openGraph).toMatchObject({ images: [{ url: "https://cdn.example/1.jpg" }] });
  });
});

describe("browsePageMetadata", () => {
  const base = {
    locale: "ka" as const,
    title: "T",
    description: "D",
    path: "/buy-sell",
    pageWord: "გვერდი",
  };

  it("keeps page 1 on the clean canonical", () => {
    const meta = browsePageMetadata({ ...base, searchParams: {} });
    expect(meta.alternates?.canonical).toBe("/buy-sell");
    expect(meta.title).toBe("T");
  });

  it("gives page 2+ a self-referencing canonical and a numbered title", () => {
    const meta = browsePageMetadata({ ...base, searchParams: { page: "3" } });
    expect(meta.alternates?.canonical).toBe("/buy-sell?page=3");
    expect(meta.title).toBe("T — გვერდი 3");
  });

  it("keeps free-text searches out of the index and off a paged canonical", () => {
    const meta = browsePageMetadata({
      ...base,
      searchParams: { q: "ლაბრადორი", page: "2" },
    });
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates?.canonical).toBe("/buy-sell");
  });
});

describe("structured data", () => {
  it("wraps nodes in a @graph and drops empty ones", () => {
    const doc = graph({ "@type": "A" }, null, undefined) as Record<string, unknown>;
    expect(doc["@context"]).toBe("https://schema.org");
    expect(doc["@graph"]).toEqual([{ "@type": "A" }]);
  });

  it("points the site search action at a real results URL", () => {
    const site = websiteJsonLd("ka", "MyPet.ge", "D") as Record<string, unknown>;
    const action = site.potentialAction as Record<string, Record<string, string>>;
    expect(action.target.urlTemplate).toBe(`${SITE_URL}/buy-sell?q={search_term_string}`);
  });

  it("emits absolute, 1-based breadcrumb positions", () => {
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Buy", path: "/buy-sell" },
    ]) as Record<string, Array<Record<string, unknown>>>;
    expect(crumbs.itemListElement[0]).toMatchObject({ position: 1, item: `${SITE_URL}/` });
    expect(crumbs.itemListElement[1]).toMatchObject({
      position: 2,
      item: `${SITE_URL}/buy-sell`,
    });
  });

  it("reports the total result count, not just the rendered page", () => {
    const page = collectionPageJsonLd({
      locale: "ka",
      name: "N",
      description: "D",
      path: "/adoption",
      totalItems: 240,
      items: [{ name: "Labrador", path: "/listings/1" }],
    }) as Record<string, Record<string, unknown>>;
    expect(page.mainEntity.numberOfItems).toBe(240);
    expect(page.mainEntity["@type"]).toBe("ItemList");
  });

  it("omits image on an item that has none", () => {
    const page = collectionPageJsonLd({
      locale: "en",
      name: "N",
      description: "D",
      path: "/adoption",
      items: [{ name: "Labrador", path: "/listings/1" }],
    }) as Record<string, Record<string, Array<Record<string, unknown>>>>;
    expect("image" in page.mainEntity.itemListElement[0]).toBe(false);
  });
});
