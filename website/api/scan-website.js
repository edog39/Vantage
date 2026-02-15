/**
 * scan-website.js
 *
 * Vercel serverless API route that scans a user-provided website URL,
 * extracts content, and uses an AI model to generate initial recommended
 * tasks. Tasks are created for the authenticated user via the tasks table.
 *
 * Intended to be called when the user finishes onboarding with a website URL
 * (e.g. from OnboardingPage "Generate my plan").
 *
 * Route:
 *   POST /api/scan-website  — Body: { url, focus?, businessType? }
 *
 * Requires: Authorization: Bearer <accessToken>
 * Optional env: GEMINI_API_KEY (if set, uses Google Gemini for analysis).
 * Falls back to a simple rule-based suggestion if no key is set.
 */

import { cors } from "./_cors.js";
import { requireAuth } from "./_auth.js";
import { sql } from "./_db.js";

/** Maximum length of page content to send to the AI (chars). */
const MAX_CONTENT_LENGTH = 12000;

/**
 * Normalizes and validates a URL string.
 *
 * @param {string} raw - User input (e.g. "example.com" or "https://example.com")
 * @returns {string|null} Normalized URL or null if invalid
 */
function normalizeUrl(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Fetches page content from the given URL. Uses Jina Reader when available
 * for cleaner text extraction; falls back to direct fetch.
 *
 * @param {string} url - Full URL to fetch
 * @returns {Promise<{ content: string, title?: string }>} Extracted content and optional title
 */
async function fetchPageContent(url) {
  // Jina Reader returns clean markdown and handles many JS-rendered sites.
  // r.jina.ai/{url} — no API key required for basic usage.
  const jinaUrl = `https://r.jina.ai/${url}`;
  try {
    const res = await fetch(jinaUrl, {
      method: "GET",
      headers: {
        Accept: "text/plain",
        "User-Agent": "VantageWebsiteScanner/1.0",
        "X-Return-Format": "markdown",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      throw new Error(`Jina fetch failed: ${res.status}`);
    }
    const content = await res.text();
    const title = res.headers.get("x-jina-title") || undefined;
    return { content: (content || "").slice(0, MAX_CONTENT_LENGTH), title };
  } catch (e) {
    // Fallback: direct fetch (works for many static sites).
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; VantageScanner/1.0; +https://vantage.app)",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const html = await res.text();
      // Strip tags for a rough text extract (no dependency).
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_CONTENT_LENGTH);
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return { content: text, title: titleMatch ? titleMatch[1].trim() : undefined };
    } catch (fallbackErr) {
      console.error("Fetch and Jina fallback failed:", fallbackErr);
      return { content: "", title: undefined };
    }
  }
}

/**
 * Calls Google Gemini to analyze website content and return suggested tasks.
 * Returns array of { title, category, priority }.
 *
 * @param {string} content - Page text/markdown
 * @param {string} [focus] - User focus: conversion, seo, funnel, performance
 * @param {string} [businessType] - e.g. saas, ecommerce, agency
 * @returns {Promise<Array<{ title: string, category?: string, priority?: number }>>}
 */
async function analyzeWithGemini(content, focus, businessType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return suggestTasksWithoutAI(content, focus, businessType);
  }

  const focusLabel =
    focus === "conversion"
      ? "improve conversion (turn visitors into customers/leads)"
      : focus === "seo"
        ? "increase organic traffic (SEO)"
        : focus === "funnel"
          ? "fix funnel drop-offs"
          : focus === "performance"
            ? "speed and UX (Core Web Vitals)"
            : "general business growth";

  const prompt = `You are a business task generator. Given a website's content (or a short summary), suggest 3–5 specific, actionable tasks for the site owner.

Rules: Return only a valid JSON array of objects. Each object must have: "title" (string), "category" (one of: marketing, sales, operations, content, product, other), "priority" (1=high, 2=medium, 3=low). No other keys. No markdown code fence, just the raw JSON array.
Example: [{"title":"Add clear CTA above the fold","category":"marketing","priority":1}]

Website content (excerpt):
${content.slice(0, 8000)}

User focus: ${focusLabel}. Business type: ${businessType || "unspecified"}.

Generate 3–5 actionable tasks as a JSON array.`;

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024,
        },
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const textPart = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const raw = (textPart || "").trim();
    if (!raw) throw new Error("Empty Gemini response");

    // Extract JSON array (handle optional markdown code block).
    let jsonStr = raw;
    const codeMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) jsonStr = codeMatch[1].trim();
    const tasks = JSON.parse(jsonStr);
    if (!Array.isArray(tasks)) throw new Error("Response was not an array");

    return tasks.map((t) => ({
      title: t.title || "Task",
      category: t.category || "other",
      priority: typeof t.priority === "number" ? t.priority : 3,
    }));
  } catch (err) {
    console.error("Gemini analysis failed:", err);
    return suggestTasksWithoutAI(content, focus, businessType);
  }
}

/**
 * Fallback when no Gemini key: suggest a small set of generic tasks
 * based on focus so the feature still works.
 *
 * @param {string} _content - Unused in fallback
 * @param {string} [focus]
 * @param {string} [_businessType]
 * @returns {Array<{ title: string, category: string, priority: number }>}
 */
function suggestTasksWithoutAI(_content, focus, _businessType) {
  const base = [
    { title: "Add or clarify your primary call-to-action above the fold", category: "marketing", priority: 1 },
    { title: "Review and improve page load speed (images, scripts)", category: "product", priority: 2 },
    { title: "Ensure key pages have unique meta titles and descriptions", category: "content", priority: 2 },
    { title: "Add trust signals (testimonials, logos, guarantees) near CTAs", category: "marketing", priority: 2 },
    { title: "Map your conversion funnel and note drop-off points", category: "operations", priority: 3 },
  ];
  if (focus === "seo") {
    return [
      { title: "Audit meta titles and descriptions on top 10 pages", category: "content", priority: 1 },
      { title: "Add or fix heading hierarchy (H1 → H2 → H3) on main pages", category: "content", priority: 1 },
      { title: "Identify and fix broken internal links", category: "operations", priority: 2 },
      ...base.slice(2, 4),
    ];
  }
  if (focus === "conversion") {
    return [
      base[0],
      base[3],
      { title: "Simplify forms (fewer fields, clear labels)", category: "product", priority: 1 },
      ...base.slice(2, 4),
    ];
  }
  if (focus === "funnel") {
    return [
      base[4],
      { title: "Add exit-intent or checkout recovery messaging", category: "marketing", priority: 2 },
      ...base.slice(1, 4),
    ];
  }
  if (focus === "performance") {
    return [
      base[1],
      { title: "Optimize or lazy-load images below the fold", category: "product", priority: 1 },
      { title: "Reduce or defer non-critical JavaScript", category: "product", priority: 2 },
      ...base.slice(2, 4),
    ];
  }
  return base;
}

/**
 * Inserts tasks for the given user. createTask logic inlined to avoid
 * circular dependency and to batch-insert.
 *
 * @param {number|string} userId - Authenticated user ID
 * @param {Array<{ title: string, category?: string, priority?: number }>} tasks
 * @returns {Promise<number>} Number of tasks created
 */
async function createTasksForUser(userId, tasks) {
  if (!tasks.length) return 0;
  let created = 0;
  for (const t of tasks) {
    await sql`
      INSERT INTO tasks (user_id, title, category, priority, source, metadata)
      VALUES (
        ${userId},
        ${t.title},
        ${t.category || "other"},
        ${t.priority ?? 3},
        'website_scan',
        ${JSON.stringify({ fromScan: true })}
      )
    `;
    created += 1;
  }
  return created;
}

/**
 * Main request handler for POST /api/scan-website.
 *
 * @param {import("vercel").VercelRequest} req
 * @param {import("vercel").VercelResponse} res
 */
export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const { url, focus, businessType } = req.body || {};
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      return res.status(400).json({ error: "Valid url is required" });
    }

    const { content, title } = await fetchPageContent(normalizedUrl);
    const analyzed = await analyzeWithGemini(content, focus, businessType);
    const tasksCreated = await createTasksForUser(auth.userId, analyzed);

    return res.status(200).json({
      success: true,
      tasksCreated,
      summary: content
        ? `Scanned ${title || normalizedUrl}; created ${tasksCreated} tasks.`
        : `Could not fetch page content; created ${tasksCreated} suggested tasks.`,
    });
  } catch (err) {
    console.error("Scan website error:", err);
    return res.status(500).json({ error: "Scan failed. Try again later." });
  }
}
