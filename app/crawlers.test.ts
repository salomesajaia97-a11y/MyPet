import { describe, expect, it } from "vitest";
import robots from "./robots";
import { GET as llmsTxt } from "./llms.txt/route";
import { SITE_URL } from "@/lib/siteUrl";

type Rule = { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] };

const agents = (rule: Rule) =>
  Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent ?? ""];

const groupFor = (name: string) =>
  (robots().rules as Rule[]).find((r) => agents(r).includes(name));

describe("robots.txt", () => {
  it("keeps the private surfaces out of every group", () => {
    for (const rule of robots().rules as Rule[]) {
      const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow ?? ""];
      expect(disallow).toContain("/admin");
      expect(disallow).toContain("/profile");
      expect(disallow).toContain("/api");
    }
  });

  // A crawler that matches a named group ignores `*` entirely, so an AI bot
  // named here without an explicit Allow would be worse off than an unnamed
  // one. Assert every one of them is actually allowed.
  it.each([
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "Google-Extended",
    "ClaudeBot",
    "Claude-User",
    "anthropic-ai",
    "PerplexityBot",
    "Applebot-Extended",
  ])("explicitly allows %s", (bot) => {
    const rule = groupFor(bot);
    expect(rule, `${bot} has no group`).toBeDefined();
    expect(rule!.allow).toBe("/");
  });

  it("lets link unfurlers reach the write flows so shared URLs still get a card", () => {
    const rule = groupFor("WhatsApp");
    expect(rule?.allow).toBe("/");
    expect(rule?.disallow).not.toContain("/listings/new");
  });

  it("points at the sitemap on the canonical origin", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(SITE_URL).not.toMatch(/localhost/);
  });
});

describe("llms.txt", () => {
  it("serves plain text naming the site and its sections", async () => {
    const res = llmsTxt();
    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");

    const body = await res.text();
    expect(body).toContain("MyPet.ge");
    for (const path of ["/buy-sell", "/adoption", "/mating", "/lost-found", "/services"]) {
      expect(body).toContain(`${SITE_URL}${path}`);
    }
    expect(body).toContain(`${SITE_URL}/sitemap.xml`);
  });
});
