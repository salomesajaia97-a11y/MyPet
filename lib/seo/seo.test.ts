import { afterEach, describe, expect, it } from "vitest";
import {
  ADOPTION_KEYWORDS,
  BUY_SELL_KEYWORDS,
  buildKeywords,
  LOST_FOUND_KEYWORDS,
  SITE_KEYWORDS,
  VET_KEYWORDS,
} from "./keywords";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqPageJsonLd,
  graph,
  siteNavigationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from "./jsonLd";
import { browsePageMetadata, pageMetadata, siteVerification } from "./metadata";
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

  // The root layout applies a "%s · MyPet.ge" template to any plain-string
  // title. The homepage title already opens with the brand.
  it("passes the title through the template by default", () => {
    const meta = pageMetadata({ locale: "en", title: "About Us", description: "D", path: "/about" });
    expect(meta.title).toBe("About Us");
  });

  it("can opt out of the title template", () => {
    const meta = pageMetadata({
      locale: "en",
      title: "MyPet.ge — Pet Listings",
      description: "D",
      path: "/",
      absoluteTitle: true,
    });
    expect(meta.title).toEqual({ absolute: "MyPet.ge — Pet Listings" });
    // og:title stays the plain string — the template is a <title> concern.
    expect(meta.openGraph?.title).toBe("MyPet.ge — Pet Listings");
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

  it("types the about and contact pages as their schema.org subtypes", () => {
    const about = webPageJsonLd({
      locale: "ka",
      type: "AboutPage",
      name: "N",
      description: "D",
      path: "/about",
    }) as Record<string, unknown>;
    expect(about["@type"]).toBe("AboutPage");
    expect(about["@id"]).toBe(`${SITE_URL}/about#webpage`);
    expect(about.isPartOf).toEqual({ "@id": `${SITE_URL}/#website` });
  });

  it("emits the site sections as absolute navigation elements", () => {
    const nav = siteNavigationJsonLd([
      { name: "Buy", path: "/buy-sell", description: "D" },
      { name: "Adopt", path: "/adoption" },
    ]) as Record<string, Array<Record<string, unknown>>>;
    expect(nav.itemListElement[0]).toMatchObject({
      "@type": "SiteNavigationElement",
      position: 1,
      url: `${SITE_URL}/buy-sell`,
    });
    // No description supplied — the key must be dropped, not shipped empty.
    expect("description" in nav.itemListElement[1]).toBe(false);
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

describe("siteVerification", () => {
  const KEYS = ["GOOGLE_SITE_VERIFICATION", "YANDEX_VERIFICATION", "BING_SITE_VERIFICATION"];

  afterEach(() => {
    for (const key of KEYS) delete process.env[key];
  });

  it("emits nothing when no console is configured", () => {
    expect(siteVerification()).toBeUndefined();
  });

  it("treats a blank value as unset, so no empty tag ships", () => {
    process.env.GOOGLE_SITE_VERIFICATION = "   ";
    expect(siteVerification()).toBeUndefined();
  });

  it("passes the Google token through, trimmed", () => {
    process.env.GOOGLE_SITE_VERIFICATION = "  token-abc  ";
    expect(siteVerification()).toEqual({ google: "token-abc" });
  });

  it("emits Bing under the raw meta name it requires", () => {
    process.env.BING_SITE_VERIFICATION = "bing-token";
    expect(siteVerification()).toEqual({ other: { "msvalidate.01": "bing-token" } });
  });

  it("carries every configured console at once", () => {
    process.env.GOOGLE_SITE_VERIFICATION = "g";
    process.env.YANDEX_VERIFICATION = "y";
    process.env.BING_SITE_VERIFICATION = "b";
    expect(siteVerification()).toEqual({
      google: "g",
      yandex: "y",
      other: { "msvalidate.01": "b" },
    });
  });
});

describe("faqPageJsonLd", () => {
  const faq = () =>
    faqPageJsonLd({
      locale: "ka",
      name: "ხშირად დასმული კითხვები",
      description: "D",
      path: "/faq",
      items: [
        { q: "განცხადება ფასიანია?", a: "არა, უფასოა." },
        { q: "როგორ განვათავსო?", a: "შედი და დააჭირე დამატებას." },
      ],
    }) as Record<string, unknown>;

  it("is a FAQPage anchored on its own URL and tied to the site node", () => {
    const node = faq();
    expect(node["@type"]).toBe("FAQPage");
    expect(node["@id"]).toBe(`${SITE_URL}/faq#faq`);
    expect(node.isPartOf).toEqual({ "@id": `${SITE_URL}/#website` });
  });

  // Google only renders the rich result when every entry is a Question with an
  // acceptedAnswer, so the shape is worth pinning.
  it("emits each entry as a Question with an acceptedAnswer", () => {
    const entries = faq().mainEntity as Array<Record<string, unknown>>;
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      "@type": "Question",
      name: "განცხადება ფასიანია?",
      acceptedAnswer: { "@type": "Answer", text: "არა, უფასოა." },
    });
  });
});
