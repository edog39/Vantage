/**
 * refresh.js
 *
 * Vercel serverless API route for issuing new access tokens based on a valid
 * refresh token. This endpoint is used by both the website and the Chrome
 * extension to keep users signed in without extending access token lifetimes.
 *
 * POST /api/auth/refresh
 * Headers: Authorization: Bearer <refreshToken>
 * Success 200: { accessToken: string, refreshToken: string }
 * Error 401: { error: string } — missing/invalid/expired token
 */

import { cors } from "../_cors.js";
import { sql } from "../_db.js";
import {
  findValidRefreshToken,
  issueTokenPair,
} from "../_auth.js";

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
 * Main request handler for POST /api/auth/refresh.
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

    const tokenRecord = await findValidRefreshToken(rawToken);
    if (!tokenRecord) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const userRows = await sql`
      SELECT id, email
      FROM users
      WHERE id = ${tokenRecord.userId}
      LIMIT 1
    `;

    if (userRows.length === 0) {
      return res.status(401).json({ error: "User for refresh token not found" });
    }

    const user = userRows[0];

    // Issue a new access/refresh token pair (rotation).
    const { accessToken, refreshToken } = await issueTokenPair({
      id: user.id,
      email: user.email,
    });

    res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    console.error("Auth refresh API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

