import { describe, expect, it } from "vitest";
import { tidyDescription } from "./describe";

describe("tidyDescription", () => {
  it("drops the dangling dash a truncated scrape leaves behind", () => {
    // The single most common shape in the live directory.
    expect(tidyDescription("ზოომაღაზია — ")).toBe("ზოომაღაზია");
    expect(tidyDescription("ვეტკლინიკა -")).toBe("ვეტკლინიკა");
    expect(tidyDescription("პეტ სასტუმრო ·")).toBe("პეტ სასტუმრო");
  });

  it("leaves a real sentence alone", () => {
    const real = "ვეტერინარული კლინიკა თბილისში, მუშაობს 24 საათი.";
    expect(tidyDescription(real)).toBe(real);
  });

  it("returns null when there was nothing but punctuation", () => {
    expect(tidyDescription("—")).toBeNull();
    expect(tidyDescription("   ")).toBeNull();
    expect(tidyDescription("")).toBeNull();
    expect(tidyDescription(null)).toBeNull();
    expect(tidyDescription(undefined)).toBeNull();
  });

  it("keeps single newlines, since some entries are a list", () => {
    expect(tidyDescription("სერვისები:\nვაქცინაცია\nგრუმინგი")).toBe(
      "სერვისები:\nვაქცინაცია\nგრუმინგი"
    );
  });

  it("collapses blank-line runs and trims each line's dangling separators", () => {
    expect(tidyDescription("ერთი —\n\n\nორი -")).toBe("ერთი\n\nორი");
  });

  it("does not eat a hyphen inside a word", () => {
    expect(tidyDescription("pet-friendly კაფე")).toBe("pet-friendly კაფე");
  });
});
