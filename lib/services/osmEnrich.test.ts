import { describe, expect, it } from "vitest";
import {
  buildOverpassQuery,
  fieldsFromOsmTags,
  fillBlanksOnly,
  normalizePhone,
  parseOpeningHours,
  parseOsmId,
} from "./osmEnrich";

describe("parseOsmId", () => {
  it("parses the stored form", () => {
    expect(parseOsmId("osm:node/11231075837")).toEqual({ type: "node", id: 11231075837 });
    expect(parseOsmId("osm:way/123")).toEqual({ type: "way", id: 123 });
  });

  it("ignores the hand-seeded rows and anything malformed", () => {
    // 18 of the live rows are seeds ("seed:vc1"), not OSM objects.
    expect(parseOsmId("seed:vc1")).toBeNull();
    expect(parseOsmId("osm:node/abc")).toBeNull();
    expect(parseOsmId("11231075837")).toBeNull();
    expect(parseOsmId(undefined)).toBeNull();
    expect(parseOsmId("")).toBeNull();
  });
});

describe("buildOverpassQuery", () => {
  it("groups ids by object type, since Overpass takes them per type", () => {
    const q = buildOverpassQuery([
      { type: "node", id: 1 },
      { type: "way", id: 2 },
      { type: "node", id: 3 },
    ]);
    expect(q).toContain("node(id:1,3);");
    expect(q).toContain("way(id:2);");
    // `center` is what makes a way (a building outline) yield a coordinate.
    expect(q).toContain("out tags center;");
  });

  it("does not ask for the same id twice", () => {
    expect(buildOverpassQuery([
      { type: "node", id: 7 },
      { type: "node", id: 7 },
    ])).toContain("node(id:7);");
  });
});

describe("normalizePhone", () => {
  it("keeps the grouped form a Georgian reader expects", () => {
    expect(normalizePhone("+995 595 55 48 66")).toBe("+995 595 55 48 66");
  });

  it("takes the first of a semicolon-separated list", () => {
    expect(normalizePhone("+995322422222;+995322422223")).toBe("+995322422222");
  });

  it("rejects anything too short to be a number", () => {
    expect(normalizePhone("n/a")).toBeUndefined();
    expect(normalizePhone("12345")).toBeUndefined();
    expect(normalizePhone("")).toBeUndefined();
    expect(normalizePhone(undefined)).toBeUndefined();
  });
});

describe("parseOpeningHours", () => {
  it("turns 24/7 into the flag, not a display line", () => {
    expect(parseOpeningHours("24/7")).toEqual({ is24h: true });
  });

  it("splits a multi-rule value into lines", () => {
    expect(parseOpeningHours("Mo-Fr 10:00-19:00; Sa-Su 11:00-18:00")).toEqual({
      lines: ["Mo-Fr 10:00-19:00", "Sa-Su 11:00-18:00"],
    });
  });

  it("returns nothing for an empty value", () => {
    expect(parseOpeningHours(undefined)).toEqual({});
    expect(parseOpeningHours("  ")).toEqual({});
  });
});

describe("fieldsFromOsmTags", () => {
  // The real payload for node/13506198401, a Tbilisi vet clinic whose row in
  // the database has no address and no phone.
  const zooFamily = {
    type: "node",
    id: 13506198401,
    lat: 41.7198,
    lon: 44.7167,
    tags: {
      "addr:housenumber": "2",
      "addr:street": "ორდე დგებუაძის ქუჩა",
      amenity: "veterinary",
      "contact:mobile": "+995 595 55 48 66",
      email: "Familyzoo654@gmail.com",
      name: "ვეტერინარული კლინიკა ზოო ფემილი",
      opening_hours: "Mo-Fr 10:00-19:00; Sa-Su 11:00-18:00",
      website: "https://zoofamily.ge/",
    },
  };

  it("assembles street and house number into one address line", () => {
    expect(fieldsFromOsmTags(zooFamily).address).toBe("ორდე დგებუაძის ქუჩა 2");
  });

  it("finds a phone stored under contact:mobile", () => {
    expect(fieldsFromOsmTags(zooFamily).phone).toBe("+995 595 55 48 66");
  });

  it("takes the hours and the website", () => {
    const out = fieldsFromOsmTags(zooFamily);
    expect(out.openingHours).toEqual(["Mo-Fr 10:00-19:00", "Sa-Su 11:00-18:00"]);
    expect(out.website).toBe("https://zoofamily.ge/");
  });

  it("derives the city from coordinates when OSM does not name one", () => {
    expect(fieldsFromOsmTags(zooFamily).city).toBe("თბილისი");
    expect(fieldsFromOsmTags(zooFamily, "en").city).toBe("Tbilisi");
  });

  it("prefers an addr:city OSM does state", () => {
    expect(
      fieldsFromOsmTags({ ...zooFamily, tags: { ...zooFamily.tags, "addr:city": "ბათუმი" } }).city
    ).toBe("ბათუმი");
  });

  it("reads a way's centre coordinate", () => {
    const way = { type: "way", id: 1, center: { lat: 41.6459, lon: 41.6417 }, tags: {} };
    expect(fieldsFromOsmTags(way).city).toBe("ბათუმი");
  });

  it("sets the 24/7 flag for a round-the-clock clinic", () => {
    const out = fieldsFromOsmTags({ ...zooFamily, tags: { opening_hours: "24/7" } });
    expect(out.is24h).toBe(true);
    expect(out.openingHours).toBeUndefined();
  });

  // The website field is rendered into an href; an importer must not be able to
  // undo the scheme check that fixed that.
  it("refuses a website that is not http(s)", () => {
    const out = fieldsFromOsmTags({
      ...zooFamily,
      tags: { website: "javascript:alert(1)" },
    });
    expect(out.website).toBeUndefined();
  });

  it("returns nothing it does not know", () => {
    expect(fieldsFromOsmTags({ type: "node", id: 1 })).toEqual({});
  });
});

describe("fillBlanksOnly", () => {
  const incoming = {
    address: "ორდე დგებუაძის ქუჩა 2",
    phone: "+995 595 55 48 66",
    website: "https://zoofamily.ge/",
    city: "თბილისი",
    openingHours: ["Mo-Fr 10:00-19:00"],
    is24h: true,
  };

  it("fills every blank field", () => {
    expect(fillBlanksOnly({ address: "", phone: null, city: "   " }, incoming)).toEqual(incoming);
  });

  // The rule that protects 133 live rows: a re-scrape must never overwrite what
  // a person entered or an owner corrected.
  it("never overwrites a value that is already there", () => {
    const update = fillBlanksOnly(
      {
        address: "ჩემი მისამართი",
        phone: "+995 555 00 00 00",
        website: "https://owner.example",
        city: "ბათუმი",
        openingHours: ["Mo-Su 09:00-21:00"],
        is24h: false,
      },
      incoming
    );
    // is24h is the one exception: it can only ever be switched on, because a
    // stored `false` is the schema default and means "nobody said".
    expect(update).toEqual({ is24h: true });
  });

  it("leaves is24h alone when it is already true", () => {
    expect(fillBlanksOnly({ is24h: true }, { is24h: true })).toEqual({});
  });

  it("does not write an empty opening-hours array over nothing", () => {
    expect(fillBlanksOnly({}, { openingHours: [] })).toEqual({});
  });

  it("is empty when there is nothing to add", () => {
    expect(fillBlanksOnly({ address: "x" }, { address: "y" })).toEqual({});
    expect(fillBlanksOnly({}, {})).toEqual({});
  });
});
