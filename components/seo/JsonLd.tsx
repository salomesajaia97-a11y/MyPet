/**
 * Renders one JSON-LD document. Kept as a component so every page emits the
 * script the same way (and so the serialization escape lives in one place).
 *
 * `</` inside a string value would otherwise close the script tag early, so it
 * is escaped — the payload includes user-supplied text (listing descriptions).
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export default JsonLd;
