import { describe, expect, it } from "vitest";
import { buildSignatureString, sign, verifySignature } from "./signature";

// Vector published in the Flitt docs (docs.flitt.com/api/building-signature).
const DOC_PARAMS = {
  merchant_id: 1549901,
  amount: 1000,
  currency: "GEL",
  order_desc: "Test payment",
  order_id: "TestOrder2",
  server_callback_url: "http://myshop/callback/",
};
const DOC_PREHASH =
  "test|1000|GEL|1549901|Test payment|TestOrder2|http://myshop/callback/";
const DOC_SIGNATURE = "cd0edb710cbbdb6c2a4d965cdb91fdfabc343215";

describe("buildSignatureString", () => {
  it("matches the documented vector", () => {
    expect(buildSignatureString("test", DOC_PARAMS)).toBe(DOC_PREHASH);
  });

  it("sorts alphabetically by key, not by insertion order", () => {
    const reversed = {
      server_callback_url: "http://myshop/callback/",
      order_id: "TestOrder2",
      order_desc: "Test payment",
      currency: "GEL",
      amount: 1000,
      merchant_id: 1549901,
    };
    expect(buildSignatureString("test", reversed)).toBe(DOC_PREHASH);
  });

  it("omits empty, null and undefined values together with their separator", () => {
    expect(
      buildSignatureString("test", { a: "1", b: "", c: null, d: undefined, e: "2" })
    ).toBe("test|1|2");
  });

  it("preserves a numeric zero", () => {
    expect(buildSignatureString("test", { a: 0, b: "1" })).toBe("test|0|1");
  });

  it("excludes signature and response_signature_string", () => {
    expect(
      buildSignatureString("test", {
        a: "1",
        signature: "deadbeef",
        response_signature_string: "test|1",
      })
    ).toBe("test|1");
  });
});

describe("sign", () => {
  it("returns the documented lowercase sha1 digest", () => {
    expect(sign("test", DOC_PARAMS)).toBe(DOC_SIGNATURE);
  });

  it("hashes Georgian text as UTF-8", () => {
    // Guards against a future switch to latin1/ascii, which would silently
    // produce a different digest for every Georgian order_desc.
    const georgian = sign("test", { order_desc: "ცხოველი" });
    expect(georgian).toBe(sign("test", { order_desc: "ცხოველი" }));
    expect(georgian).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe("verifySignature", () => {
  it("accepts a payload carrying its own valid signature", () => {
    expect(verifySignature("test", { ...DOC_PARAMS, signature: DOC_SIGNATURE })).toBe(true);
  });

  it("rejects a tampered amount", () => {
    expect(
      verifySignature("test", { ...DOC_PARAMS, amount: 1, signature: DOC_SIGNATURE })
    ).toBe(false);
  });

  it("ignores a diagnostic response_signature_string", () => {
    expect(
      verifySignature("test", {
        ...DOC_PARAMS,
        signature: DOC_SIGNATURE,
        response_signature_string: "nonsense",
      })
    ).toBe(true);
  });

  it("rejects a missing signature", () => {
    expect(verifySignature("test", DOC_PARAMS)).toBe(false);
  });

  it("is case-insensitive about the received hex", () => {
    expect(verifySignature("test", DOC_PARAMS, DOC_SIGNATURE.toUpperCase())).toBe(true);
  });
});
