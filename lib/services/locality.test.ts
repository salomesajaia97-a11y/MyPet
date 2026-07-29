import { describe, expect, it } from "vitest";
import { cityFromCoords, distanceKm, localityFor } from "./locality";
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
