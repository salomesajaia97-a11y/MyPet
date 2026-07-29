import { describe, expect, it } from "vitest";
import { placeFromNominatim, reverseUrl, stripDistrictSuffix } from "./reverseGeocode";

describe("stripDistrictSuffix", () => {
  it("drops the administrative suffix, which is noise in an address line", () => {
    // Nominatim says "საბურთალოს რაიონი"; an address reads better as the
    // district name alone, and it sits closer to the "საბურთალო" the
    // marketplace district list uses.
    expect(stripDistrictSuffix("საბურთალოს რაიონი")).toBe("საბურთალოს");
    expect(stripDistrictSuffix("ისნის რაიონი")).toBe("ისნის");
  });

  it("leaves a name that has no suffix alone", () => {
    expect(stripDistrictSuffix("ბაგრატიონი II")).toBe("ბაგრატიონი II");
  });
});

describe("placeFromNominatim", () => {
  // The live response for "Vet House" (41.72, 44.75), a row with no address.
  const vetHouse = {
    address: {
      road: "ადამ მიცკევიჩის ქუჩა",
      house_number: "70",
      suburb: "საბურთალოს რაიონი",
      city: "თბილისი",
    },
  };

  it("writes the street with its house number, in the order Georgian addresses use", () => {
    expect(placeFromNominatim(vetHouse).address).toBe("ადამ მიცკევიჩის ქუჩა 70");
  });

  it("takes the district and the city", () => {
    const out = placeFromNominatim(vetHouse);
    expect(out.neighborhood).toBe("საბურთალოს");
    expect(out.city).toBe("თბილისი");
  });

  it("keeps a street with no house number", () => {
    // "Companion" in Chughureti: road known, house number not.
    expect(
      placeFromNominatim({
        address: { road: "მიხეილ წინამძღვრიშვილის ქუჩა", city: "თბილისი" },
      }).address
    ).toBe("მიხეილ წინამძღვრიშვილის ქუჩა");
  });

  it("never emits a house number on its own", () => {
    // A bare number is not an address, and would render as "70" on the page.
    expect(placeFromNominatim({ address: { house_number: "70" } }).address).toBeUndefined();
  });

  it("falls back through town and village for smaller places", () => {
    expect(placeFromNominatim({ address: { town: "ქობულეთი" } }).city).toBe("ქობულეთი");
    expect(placeFromNominatim({ address: { village: "ყვარელი" } }).city).toBe("ყვარელი");
  });

  it("drops a neighbourhood that just repeats the city", () => {
    const out = placeFromNominatim({ address: { suburb: "ბათუმი", city: "ბათუმი" } });
    expect(out.neighborhood).toBeUndefined();
    expect(out.city).toBe("ბათუმი");
  });

  it("returns nothing for an error or an empty response", () => {
    expect(placeFromNominatim({ error: "Unable to geocode" })).toEqual({});
    expect(placeFromNominatim({})).toEqual({});
    expect(placeFromNominatim({ address: {} })).toEqual({});
  });

  it("ignores blank strings rather than storing them", () => {
    expect(placeFromNominatim({ address: { road: "   ", city: "" } })).toEqual({});
  });
});

describe("reverseUrl", () => {
  it("asks for building-level detail in the requested language", () => {
    const url = reverseUrl(41.7151, 44.8271, "ka");
    expect(url).toContain("lat=41.7151");
    expect(url).toContain("lon=44.8271");
    expect(url).toContain("zoom=18");
    expect(url).toContain("accept-language=ka");
    expect(url).toContain("format=jsonv2");
  });
});
