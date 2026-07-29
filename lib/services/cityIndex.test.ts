import { describe, expect, it } from "vitest";
import { cityOf, groupByCity, MIN_PER_CITY_PAGE, rowsInCity } from "./cityIndex";
import { cityBySlug } from "./locality";

const tbilisiCoords = { lat: 41.7198, lng: 44.7167 };
const batumiCoords = { lat: 41.6459, lng: 41.6417 };

describe("cityOf", () => {
  it("prefers the stored city name", () => {
    expect(cityOf({ city: "ბათუმი", ...tbilisiCoords })?.slug).toBe("batumi");
  });

  it("falls back to the coordinates, which is what most rows have", () => {
    // Two thirds of the live rows have no stored city; three quarters have
    // coordinates. Without this the pages could not exist yet.
    expect(cityOf({ city: "", ...tbilisiCoords })?.slug).toBe("tbilisi");
  });

  it("places a row stored with a district by its coordinates", () => {
    // "ვაკე" is a Tbilisi district, not a city name.
    expect(cityOf({ city: "ვაკე", ...tbilisiCoords })?.slug).toBe("tbilisi");
  });

  it("returns null when there is nothing to place it by", () => {
    expect(cityOf({})).toBeNull();
    expect(cityOf({ city: "  " })).toBeNull();
  });
});

describe("groupByCity", () => {
  const rows = [
    { id: 1, ...tbilisiCoords },
    { id: 2, ...tbilisiCoords },
    { id: 3, ...tbilisiCoords },
    { id: 4, ...batumiCoords },
    { id: 5, city: "ქუთაისი" },
  ];

  it("keeps only groups big enough to be worth a page", () => {
    // One-entry pages are thinner than the business's own page and read as
    // doorway pages.
    const groups = groupByCity(rows);
    expect(groups.map((g) => g.city.slug)).toEqual(["tbilisi"]);
    expect(groups[0].rows).toHaveLength(3);
  });

  it("orders the biggest group first", () => {
    const many = [
      ...rows,
      { id: 6, ...batumiCoords },
      { id: 7, ...batumiCoords },
      { id: 8, ...batumiCoords },
      { id: 9, ...batumiCoords },
    ];
    expect(groupByCity(many).map((g) => g.city.slug)).toEqual(["batumi", "tbilisi"]);
  });

  it("honours a caller's own threshold", () => {
    expect(groupByCity(rows, 1).map((g) => g.city.slug).sort()).toEqual([
      "batumi",
      "kutaisi",
      "tbilisi",
    ]);
  });

  it("ignores rows it cannot place", () => {
    expect(groupByCity([{ id: 1 }, { id: 2 }, { id: 3 }], 1)).toEqual([]);
  });

  it("defaults to a threshold of three", () => {
    expect(MIN_PER_CITY_PAGE).toBe(3);
  });
});

describe("rowsInCity", () => {
  it("returns the rows in that city however their town was resolved", () => {
    const tbilisi = cityBySlug("tbilisi")!;
    const rows = [
      { id: 1, ...tbilisiCoords },
      { id: 2, city: "თბილისი" },
      { id: 3, ...batumiCoords },
    ];
    expect(rowsInCity(rows, tbilisi).map((r) => r.id)).toEqual([1, 2]);
  });
});
