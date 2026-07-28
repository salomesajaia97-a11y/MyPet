import { describe, expect, it } from "vitest";
import { normalizeWebsite, safeExternalUrl } from "./url";

describe("safeExternalUrl", () => {
  it("keeps http and https links", () => {
    expect(safeExternalUrl("https://vet.ge/clinic")).toBe("https://vet.ge/clinic");
    expect(safeExternalUrl("http://vet.ge")).toBe("http://vet.ge/");
  });

  it("assumes https for a bare host, the way people type it", () => {
    expect(safeExternalUrl("vet.ge")).toBe("https://vet.ge/");
    expect(safeExternalUrl("  www.vet.ge/about  ")).toBe("https://www.vet.ge/about");
  });

  it("refuses schemes that execute or embed", () => {
    // This is the whole point: these used to reach an <a href> unchecked.
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("JavaScript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeExternalUrl("vbscript:msgbox(1)")).toBeNull();
    expect(safeExternalUrl("file:///etc/passwd")).toBeNull();
  });

  it("refuses anything that is not a usable string", () => {
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl("   ")).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl(42)).toBeNull();
    expect(safeExternalUrl("https://")).toBeNull();
  });
});

describe("normalizeWebsite", () => {
  it("treats absent and blank as simply unset", () => {
    expect(normalizeWebsite(undefined)).toBeUndefined();
    expect(normalizeWebsite(null)).toBeUndefined();
    expect(normalizeWebsite("")).toBeUndefined();
  });

  it("normalizes a real link and flags a dangerous one", () => {
    expect(normalizeWebsite("vet.ge")).toBe("https://vet.ge/");
    expect(normalizeWebsite("javascript:alert(1)")).toBe("invalid");
  });
});
