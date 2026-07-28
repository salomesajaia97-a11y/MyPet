import { describe, expect, it } from "vitest";
import { applyOverrides, flattenDictionary } from "./overrides";
import { getDictionary } from ".";
import type { Dictionary } from ".";

describe("flattenDictionary", () => {
  it("flattens nested strings to dot paths", () => {
    const flat = flattenDictionary({ a: "one", b: { c: "two", d: { e: "three" } } });
    expect(flat).toEqual({ a: "one", "b.c": "two", "b.d.e": "three" });
  });

  it("skips arrays and non-strings, which are structure rather than copy", () => {
    const flat = flattenDictionary({ list: ["a", "b"], count: 3, ok: true, text: "yes" });
    expect(flat).toEqual({ text: "yes" });
  });

  it("covers the real dictionary", () => {
    const flat = flattenDictionary(getDictionary("ka"));
    // Spot-check a key the editor must be able to reach.
    expect(flat["common.actions.delete"]).toBeTypeOf("string");
    expect(Object.keys(flat).length).toBeGreaterThan(400);
  });
});

describe("applyOverrides", () => {
  const base = { a: "one", b: { c: "two" }, list: ["x"] } as unknown as Dictionary;

  it("returns the same object when there is nothing to apply", () => {
    expect(applyOverrides(base, {})).toBe(base);
  });

  it("replaces a nested string without touching the rest", () => {
    const out = applyOverrides(base, { "b.c": "changed" }) as unknown as typeof base;
    expect(out).toEqual({ a: "one", b: { c: "changed" }, list: ["x"] });
    // The input is left alone — the dictionaries are module-level singletons.
    expect((base as unknown as { b: { c: string } }).b.c).toBe("two");
  });

  it("ignores a key that no longer exists in the dictionary", () => {
    const out = applyOverrides(base, { "b.gone": "nope", missing: "nope" });
    expect(out).toEqual({ a: "one", b: { c: "two" }, list: ["x"] });
  });

  it("refuses to overwrite something that is not a string", () => {
    // An override must never turn an array into a sentence and break the page
    // that maps over it.
    const out = applyOverrides(base, { list: "not an array" }) as unknown as { list: string[] };
    expect(out.list).toEqual(["x"]);
  });

  it("applies to the real dictionary and keeps its shape", () => {
    const ka = getDictionary("ka");
    const out = applyOverrides(ka, { "common.actions.delete": "წაშლა!" });
    expect(out.common.actions.delete).toBe("წაშლა!");
    expect(out.nav).toEqual(ka.nav);
  });
});
