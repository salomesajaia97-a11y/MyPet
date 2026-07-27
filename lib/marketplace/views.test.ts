import { describe, expect, it } from "vitest";
import {
  formatPublishedDate,
  shortListingId,
  tbilisiDayStamp,
  viewDedupeKey,
} from "./views";

describe("shortListingId", () => {
  it("takes the first 6 hex characters", () => {
    expect(shortListingId("bf816f742e4b4fd8bbb686b35b215596")).toBe("bf816f");
  });

  it("returns short input unchanged instead of padding it", () => {
    expect(shortListingId("abc")).toBe("abc");
  });
});

describe("formatPublishedDate", () => {
  const iso = "2026-05-16T09:30:00.000Z";

  it("renders day, short month and year in English", () => {
    expect(formatPublishedDate(iso, "en")).toBe("May 16, 2026");
  });

  it("renders the Georgian form for ka", () => {
    const out = formatPublishedDate(iso, "ka");
    expect(out).toContain("16");
    expect(out).toContain("2026");
    // Georgian script, not a fallback to English month names.
    expect(out).toMatch(/[Ⴀ-ჿ]/);
  });
});

describe("tbilisiDayStamp", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(tbilisiDayStamp(new Date("2026-05-16T09:30:00.000Z"))).toBe("2026-05-16");
  });

  it("uses Tbilisi local time, so late-evening UTC is already the next day", () => {
    // 21:00 UTC == 01:00 next day in Tbilisi (UTC+4).
    expect(tbilisiDayStamp(new Date("2026-05-16T21:00:00.000Z"))).toBe("2026-05-17");
  });

  it("does not roll over before local midnight", () => {
    // 19:59 UTC == 23:59 the same day in Tbilisi.
    expect(tbilisiDayStamp(new Date("2026-05-16T19:59:00.000Z"))).toBe("2026-05-16");
  });
});

describe("viewDedupeKey", () => {
  const base = {
    listingId: "bf816f742e4b4fd8bbb686b35b215596",
    ip: "1.2.3.4",
    userAgent: "Mozilla/5.0",
    day: "2026-05-16",
    secret: "test-secret",
  };

  it("is stable for identical input", () => {
    expect(viewDedupeKey(base)).toBe(viewDedupeKey({ ...base }));
  });

  it("never contains the raw ip or user agent", () => {
    const key = viewDedupeKey(base);
    expect(key).not.toContain(base.ip);
    expect(key).not.toContain(base.userAgent);
    expect(key).toMatch(/^[a-f0-9]{64}$/);
  });

  it.each([
    ["listingId", { listingId: "aaaaaaaaaaaaaaaaaaaaaaaa" }],
    ["ip", { ip: "5.6.7.8" }],
    ["userAgent", { userAgent: "curl/8.0" }],
    ["day", { day: "2026-05-17" }],
    ["secret", { secret: "other-secret" }],
  ])("changes when %s changes", (_field, patch) => {
    expect(viewDedupeKey({ ...base, ...patch })).not.toBe(viewDedupeKey(base));
  });

  it("does not collide when the separator is shifted between fields", () => {
    // "a|b" must not hash the same as "a" + "|b" glued differently.
    const a = viewDedupeKey({ ...base, listingId: "ab", ip: "c" });
    const b = viewDedupeKey({ ...base, listingId: "a", ip: "bc" });
    expect(a).not.toBe(b);
  });
});
