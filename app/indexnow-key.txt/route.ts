import { indexNowKey } from "@/lib/seo/indexNow";

/**
 * The IndexNow key file.
 *
 * When a URL is submitted, the engine fetches this path and checks that the
 * body matches the key in the submission — that is the whole ownership proof.
 * Served from the app rather than `public/` so the secret stays an environment
 * variable and never enters the repository.
 *
 * 404 while unconfigured, so the endpoint never advertises an empty key.
 */
export async function GET() {
  const key = indexNowKey();
  if (!key) return new Response("Not found", { status: 404 });

  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
