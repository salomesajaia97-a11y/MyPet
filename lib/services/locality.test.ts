import { describe, expect, it } from "vitest";
import { cityByName, cityBySlug, cityFromCoords, distanceKm, localityFor, locativeKa } from "./locality";
import { CITIES as FILTER_CITIES } from "@/lib/marketplace/filters";
import { CITIES } from "./locality";

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    expect(distanceKm({ lat: 41.7, lng: 44.8 }, { lat: 41.7, lng: 44.8 })).toBe(0);
  });

  it("matches the known Tbilisi–Batumi distance to within a few km", () => {
    const km = distanceKm({ lat: 41.7151, lng: 44.8271 }, { lat: 41.6459, lng: 41.6417 });
    expect(km).toBeGreaterThan(260);
    expect(km).toBeLessThan(275);
  });
});

describe("cityFromCoords", () => {
  it("resolves a Tbilisi pet shop", () => {
    // The zoocity.ge entry from the live directory: coordinates, no city.
    expect(cityFromCoords(41.7198201, 44.7167043)?.ka).toBe("თბილისი");
  });

  it("resolves the coastal cities apart", () => {
    expect(cityFromCoords(41.6459, 41.6417)?.en).toBe("Batumi");
    expect(cityFromCoords(41.8214, 41.7783)?.en).toBe("Kobuleti");
  });

  it("picks the nearest city when two radii overlap", () => {
    // Just outside Mtskheta, closer to it than to Tbilisi centre.
    expect(cityFromCoords(41.84, 44.72)?.en).toBe("Mtskheta");
  });

  // Being wrong about the town is worse than saying nothing: a wrong locality
  // is a wrong signal in both the structured data and the city filter.
  it("returns null for a spot far from any listed city", () => {
    expect(cityFromCoords(42.9, 43.6)).toBeNull();
  });

  it("returns null outside Georgia, for missing values and for NaN", () => {
    expect(cityFromCoords(48.85, 2.35)).toBeNull(); // Paris
    expect(cityFromCoords(undefined, undefined)).toBeNull();
    expect(cityFromCoords(null, 44.8)).toBeNull();
    expect(cityFromCoords(NaN, NaN)).toBeNull();
    // 0,0 is the classic "coordinates were never set" value.
    expect(cityFromCoords(0, 0)).toBeNull();
  });
});

describe("localityFor", () => {
  it("prefers what a human typed over what we derived", () => {
    expect(
      localityFor({ city: "ვაკე", lat: 41.7198, lng: 44.7167 }, "ka")
    ).toBe("ვაკე");
  });

  it("treats a blank stored city as absent", () => {
    expect(localityFor({ city: "   ", lat: 41.7198, lng: 44.7167 }, "ka")).toBe("თბილისი");
  });

  it("answers in the requested language", () => {
    expect(localityFor({ lat: 42.2679, lng: 42.6946 }, "en")).toBe("Kutaisi");
    expect(localityFor({ lat: 42.2679, lng: 42.6946 }, "ka")).toBe("ქუთაისი");
  });

  it("returns null rather than guessing when there is nothing to go on", () => {
    expect(localityFor({}, "ka")).toBeNull();
  });
});

describe("city vocabulary", () => {
  // A derived locality is fed into the same city filter as a typed one, so a
  // Georgian name that is not in the marketplace list would be unfilterable.
  it("uses only Georgian names the marketplace filter knows", () => {
    for (const city of CITIES) {
      expect(FILTER_CITIES as readonly string[]).toContain(city.ka);
    }
  });

  it("has no duplicate entries", () => {
    const names = CITIES.map((c) => c.ka);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("city slugs", () => {
  it("gives every city a unique Latin slug", () => {
    const slugs = CITIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z-]+$/);
  });

  it("resolves a slug back to its city, case-insensitively", () => {
    expect(cityBySlug("tbilisi")?.ka).toBe("თბილისი");
    expect(cityBySlug("  Batumi ")?.ka).toBe("ბათუმი");
  });

  it("returns null for an unknown or empty slug", () => {
    expect(cityBySlug("paris")).toBeNull();
    expect(cityBySlug("")).toBeNull();
    expect(cityBySlug(undefined)).toBeNull();
  });
});

describe("cityByName", () => {
  it("matches a stored name in either language", () => {
    expect(cityByName("თბილისი")?.slug).toBe("tbilisi");
    expect(cityByName("Tbilisi")?.slug).toBe("tbilisi");
    expect(cityByName("  kutaisi ")?.slug).toBe("kutaisi");
  });

  it("returns null for a district or anything unrecognised", () => {
    // Stored values include districts like "ვაკე", which are not cities.
    expect(cityByName("ვაკე")).toBeNull();
    expect(cityByName("")).toBeNull();
  });
});

describe("locativeKa", () => {
  // "ვეტკლინიკები თბილისში" is the phrase people search; the nominative reads
  // as broken Georgian and matches the query less well.
  it("replaces the nominative -ი with -ში", () => {
    expect(locativeKa("თბილისი")).toBe("თბილისში");
    expect(locativeKa("ბათუმი")).toBe("ბათუმში");
    expect(locativeKa("ქუთაისი")).toBe("ქუთაისში");
    expect(locativeKa("რუსთავი")).toBe("რუსთავში");
    expect(locativeKa("გორი")).toBe("გორში");
    expect(locativeKa("ქობულეთი")).toBe("ქობულეთში");
  });

  it("just appends -ში after another vowel", () => {
    expect(locativeKa("მცხეთა")).toBe("მცხეთაში");
    expect(locativeKa("ახალციხე")).toBe("ახალციხეში");
    expect(locativeKa("სტეფანწმინდა")).toBe("სტეფანწმინდაში");
  });

  it("covers every city in the table without producing a double suffix", () => {
    for (const city of CITIES) {
      const out = locativeKa(city.ka);
      expect(out.endsWith("ში")).toBe(true);
      expect(out.endsWith("შიში")).toBe(false);
    }
  });

  it("leaves a blank value alone", () => {
    expect(locativeKa("   ")).toBe("");
  });
});
