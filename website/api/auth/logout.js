/**
 * logout.js
 *
 * Vercel serverless API route for logging a user out by revoking a specific
 * refresh token. Both the website and the Chrome extension should call this
 * endpoint when the user explicitly logs out.
 *
 * POST /api/auth/logout
 * Headers: Authorization: Bearer <refreshToken>
 * Success 204: (no body)
 * Error 401: { error: string } — missing/invalid token
 */

import { cors } from "../_cors.js";
import { revokeRefreshToken } from "../_auth.js";

/**
 * Extracts the Bearer token from the Authorization header.
 *
 * @param {import("vercel").VercelRequest} req - Incoming request.
 * @returns {string | null} Raw token string or null.
 */
function extractBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== "string") {
    return null;
  }
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

/**
 * Main request handler for POST /api/auth/logout.
 *
 * @param {import("vercel").VercelRequest} req - Vercel request object.
 * @param {import("vercel").VercelResponse} res - Vercel response object.
 */
export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawToken = extractBearerToken(req);
    if (!rawToken) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    await revokeRefreshToken(rawToken);
    res.status(204).end();
  } catch (err) {
    console.error("Auth logout API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

