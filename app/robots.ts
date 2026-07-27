import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Private / auth-gated areas and API endpoints shouldn't be crawled. Beyond
 * those, the write and edit flows plus the payment return page are dead ends
 * for a crawler, so crawl budget lands on real listings instead.
 *
 * Free-text search results (`?q=`) are deliberately NOT blocked here — they
 * carry `robots: noindex` from the page itself, and a disallow would stop
 * Google from ever reading that directive.
 */
const DISALLOW = [
  "/admin",
  "/profile",
  "/api",
  "/login",
  "/register",
  "/payment",
  "/listings/new",
  "/services/new",
  "/listings/*/edit",
  "/services/*/*/edit",
];

/** Nothing but the genuinely private surfaces — for crawlers we want deep. */
const PRIVATE_ONLY = ["/admin", "/profile", "/api"];

/**
 * Generative-AI crawlers, listed explicitly.
 *
 * A bot that matches a named group ignores the `*` group entirely, so silence
 * here is not the same as consent: several of these (Google-Extended,
 * Applebot-Extended) are *opt-out* tokens that only ever appear in a
 * disallow, and publishers routinely block the rest by default. Naming them
 * with an explicit `Allow` is how we state that MyPet.ge wants to be readable
 * by AI answer engines — being cited in an AI answer is the whole point of a
 * classifieds portal in a market this small.
 *
 * Each group repeats the disallow list because groups do not inherit.
 */
const AI_BOTS = [
  // OpenAI — training, search index, and live user-triggered fetches.
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Google — Gemini / AI Overviews grounding (separate from Googlebot).
  "Google-Extended",
  // Anthropic.
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  // Perplexity.
  "PerplexityBot",
  "Perplexity-User",
  // Apple Intelligence.
  "Applebot-Extended",
  // Microsoft Copilot rides Bingbot, but names its own agent too.
  "Bingbot",
  // The rest of the answer-engine field.
  "Amazonbot",
  "meta-externalagent",
  "MistralAI-User",
  "DuckAssistBot",
  "cohere-ai",
  "YouBot",
  "CCBot",
  "Diffbot",
  "Timpibot",
  "Kangaroo Bot",
  "omgili",
];

/** Classic search crawlers. Same rules as `*`, spelled out so they're pinned. */
const SEARCH_BOTS = ["Googlebot", "Bingbot", "DuckDuckBot", "YandexBot", "Applebot", "Slurp"];

/**
 * Link unfurlers. These fetch one URL a user just pasted into a chat and read
 * its OpenGraph tags — they need the public pages but nothing else, and they
 * must never be lumped in with a restrictive default or shared listings render
 * as a bare link with no card.
 */
const SOCIAL_BOTS = [
  "facebookexternalhit",
  "facebookcatalog",
  "Facebot",
  "Twitterbot",
  "WhatsApp",
  "TelegramBot",
  "LinkedInBot",
  "Slackbot",
  "Slackbot-LinkExpanding",
  "Discordbot",
  "Pinterest",
  "redditbot",
  "vkShare",
  "Viber",
  "SkypeUriPreview",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      {
        userAgent: SEARCH_BOTS,
        allow: "/",
        disallow: DISALLOW,
      },
      {
        userAgent: AI_BOTS,
        allow: "/",
        disallow: DISALLOW,
      },
      {
        userAgent: SOCIAL_BOTS,
        allow: "/",
        disallow: PRIVATE_ONLY,
      },
      // Image crawlers earn their keep here: listing photos are the reason
      // people click through from Google Images.
      {
        userAgent: ["Googlebot-Image", "Bingbot-Image"],
        allow: "/",
        disallow: PRIVATE_ONLY,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
