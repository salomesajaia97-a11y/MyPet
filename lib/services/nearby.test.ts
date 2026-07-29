import { describe, expect, it } from "vitest";
import { rankNearby } from "./nearby";

const tbilisi = { _id: "self", name: "Self", lat: 41.7151, lng: 44.8271, city: "თბილისი" };

describe("rankNearby", () => {
  it("never includes the business itself", () => {
    expect(rankNearby(tbilisi, [tbilisi])).toEqual([]);
  });

  it("orders by real distance when coordinates are available", () => {
    const out = rankNearby(tbilisi, [
      { _id: "far", name: "Batumi shop", lat: 41.6459, lng: 41.6417 },
      { _id: "near", name: "Vake vet", lat: 41.7093, lng: 44.7593 },
    ]);
    expect(out.map((c) => c._id)).toEqual(["near", "far"]);
    expect(out[0].km).toBeLessThan(10);
  });

  it("prefers a measured neighbour over a same-city entry with no coordinates", () => {
    const out = rankNearby(tbilisi, [
      { _id: "nocoords", name: "No coords", city: "თბილისი" },
      { _id: "measured", name: "Measured", lat: 41.72, lng: 44.83 },
    ]);
    expect(out[0]._id).toBe("measured");
  });

  it("falls back to the same city when nothing has coordinates", () => {
    const out = rankNearby({ _id: "self", name: "Self", city: "ბათუმი" }, [
      { _id: "other-city", name: "A", city: "თბილისი" },
      { _id: "same-city", name: "B", city: "ბათუმი" },
    ]);
    expect(out[0]._id).toBe("same-city");
  });

  it("still returns something when there is nothing to rank on", () => {
    // A row with no city and no coordinates must not get an empty block.
    const out = rankNearby({ _id: "self", name: "Self" }, [
      { _id: "a", name: "A" },
      { _id: "b", name: "B" },
    ]);
    expect(out.map((c) => c._id)).toEqual(["a", "b"]);
  });

  it("honours the limit", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      _id: String(i),
      name: `B${i}`,
      lat: 41.7 + i / 100,
      lng: 44.8,
    }));
    expect(rankNearby(tbilisi, many, 6)).toHaveLength(6);
  });

  it("does not leak its internal ranking flag to the caller", () => {
    const out = rankNearby(tbilisi, [{ _id: "a", name: "A", city: "თბილისი" }]);
    expect("cityMatch" in out[0]).toBe(false);
  });
});
