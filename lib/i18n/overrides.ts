import type { Dictionary } from ".";

export type TextOverrides = Record<string, string>;

/**
 * Flatten a dictionary to dot-path → string.
 *
 * Only string leaves are returned. The dictionaries also hold arrays and
 * numbers in places, and those are structural: an editor that let someone
 * replace an array with a sentence would break the page rendering it, so they
 * are not editable at all rather than editable-and-guarded.
 */
export function flattenDictionary(
  node: unknown,
  prefix = "",
  out: TextOverrides = {}
): TextOverrides {
  if (typeof node === "string") {
    out[prefix] = node;
    return out;
  }
  if (!node || typeof node !== "object" || Array.isArray(node)) return out;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    flattenDictionary(value, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
}

/**
 * Return a copy of `dict` with overrides applied.
 *
 * Structure-preserving and paranoid, because this runs on every request and
 * feeds every page: a path that no longer exists in the dictionary is ignored
 * (a key can be renamed in code while an old override row lingers), and a path
 * that does not currently hold a string is left alone (an override must never
 * turn an object or array into text).
 */
export function applyOverrides(dict: Dictionary, overrides: TextOverrides): Dictionary {
  const entries = Object.entries(overrides);
  if (entries.length === 0) return dict;

  // structuredClone keeps the shape without hand-writing a deep copy, and the
  // dictionaries are plain data so there is nothing it cannot clone.
  const copy = structuredClone(dict) as unknown as Record<string, unknown>;

  for (const [path, value] of entries) {
    if (typeof value !== "string") continue;
    const parts = path.split(".");
    let cursor: Record<string, unknown> = copy;
    let ok = true;
    for (const part of parts.slice(0, -1)) {
      const next = cursor[part];
      if (!next || typeof next !== "object" || Array.isArray(next)) {
        ok = false;
        break;
      }
      cursor = next as Record<string, unknown>;
    }
    const leaf = parts[parts.length - 1];
    // Both guards matter: the key must already exist, and it must already be a
    // string. Anything else means the override is stale or malformed.
    if (ok && typeof cursor[leaf] === "string") cursor[leaf] = value;
  }

  return copy as unknown as Dictionary;
}
