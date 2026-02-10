/**
 * _auth.js
 *
 * Shared authentication utilities for all Vercel serverless API routes.
 * Provides helpers for issuing access and refresh tokens, persisting refresh
 * tokens in the database, and enforcing JWT-based authentication on requests.
 *
 * Design principles:
 * - Short-lived access tokens (JWT) for API authorization.
 * - Long-lived refresh tokens stored server-side for revocation and rotation.
 * - Single source of truth for signing and verifying tokens.
 * - No framework-specific middleware; instead, explicit helpers that can be
 *   called from each handler function.
 */

import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sql } from "./_db.js";

// ---------------------------------------------------------------------------
// Configuration constants
// ---------------------------------------------------------------------------

/**
 * Secret used to sign and verify JWT access tokens.
 * In production this MUST be overridden via the JWT_SECRET environment variable.
 */
const JWT_SECRET = process.env.JWT_SECRET || "vantage-dev-secret-change-in-production";

/**
 * Access token lifetime. Kept relatively short so that leaked tokens have
 * limited impact. The refresh token model allows users to stay signed in.
 */
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

/**
 * Refresh token lifetime in days. This is converted to a concrete timestamp
 * and stored alongside the refresh token hash in the database.
 */
const REFRESH_TOKEN_DAYS = Number.parseInt(
  process.env.REFRESH_TOKEN_DAYS || "30",
  10
);

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

/**
 * Issues a signed JWT access token for the given user.
 *
 * @param {{ id: number | string, email: string }} user - Minimal user payload.
 * @returns {string} Signed JWT access token.
 */
export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

/**
 * Hashes a refresh token string before persistence.
 * Uses a one-way hash so that leaked database rows cannot be used directly.
 *
 * @param {string} token - Raw refresh token.
 * @returns {string} Hashed token suitable for storage.
 */
function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a new cryptographically random refresh token string.
 *
 * @returns {string} Raw refresh token.
 */
function generateRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

/**
 * Computes a future expiration timestamp for a refresh token.
 *
 * @returns {string} ISO-8601 timestamp for the token expiration.
 */
function computeRefreshExpiry() {
  const expires = new Date();
  expires.setDate(expires.getDate() + REFRESH_TOKEN_DAYS);
  return expires.toISOString();
}

/**
 * Persists a newly generated refresh token for a given user.
 * The raw token is returned to the caller while only the hash is stored.
 *
 * @param {number | string} userId - ID of the user the token belongs to.
 * @returns {Promise<string>} Raw refresh token.
 */
export async function createRefreshToken(userId) {
  const rawToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(rawToken);
  const expiresAt = computeRefreshExpiry();

  // refresh_tokens table is expected to exist in the database schema:
  // columns: id, user_id, token_hash, expires_at, revoked, created_at
  await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked)
    VALUES (${userId}, ${tokenHash}, ${expiresAt}, false)
  `;

  return rawToken;
}

/**
 * Marks a single refresh token as revoked, if it exists.
 *
 * @param {string} rawToken - Raw refresh token from the client.
 * @returns {Promise<void>}
 */
export async function revokeRefreshToken(rawToken) {
  if (!rawToken) {
    return;
  }
  const tokenHash = hashRefreshToken(rawToken);
  await sql`
    UPDATE refresh_tokens
    SET revoked = true
    WHERE token_hash = ${tokenHash}
  `;
}

/**
 * Revokes all refresh tokens for a user. Useful for global logout.
 *
 * @param {number | string} userId - User whose tokens should be revoked.
 * @returns {Promise<void>}
 */
export async function revokeAllRefreshTokensForUser(userId) {
  await sql`
    UPDATE refresh_tokens
    SET revoked = true
    WHERE user_id = ${userId}
  `;
}

/**
 * Looks up and validates a refresh token from the database.
 * Returns the associated user_id if the token is found, not revoked, and not expired.
 *
 * @param {string} rawToken - Raw refresh token from the client.
 * @returns {Promise<{ userId: number } | null>} Minimal token payload or null.
 */
export async function findValidRefreshToken(rawToken) {
  if (!rawToken) {
    return null;
  }

  const tokenHash = hashRefreshToken(rawToken);

  const rows = await sql`
    SELECT user_id, expires_at, revoked
    FROM refresh_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  if (row.revoked) {
    return null;
  }

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return null;
  }

  return { userId: row.user_id };
}

// ---------------------------------------------------------------------------
// Request authentication helper
// ---------------------------------------------------------------------------

/**
 * Extracts the Bearer token from the Authorization header.
 *
 * @param {import("vercel").VercelRequest} req - Incoming request.
 * @returns {string | null} Raw token or null if header is missing/invalid.
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
 * Verifies the JWT access token on a request and returns the authenticated user
 * information. If verification fails, this helper sends a 401 response and
 * returns null so that callers can exit early.
 *
 * @param {import("vercel").VercelRequest} req - Incoming request.
 * @param {import("vercel").VercelResponse} res - Response object.
 * @returns {{ userId: number | string, email: string } | null} Authenticated user info.
 */
export function requireAuth(req, res) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing Authorization header" });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // decoded.sub contains the user id; decoded.email contains the email.
    return {
      userId: decoded.sub,
      email: decoded.email,
    };
  } catch (err) {
    console.error("JWT verification failed:", err);
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

/**
 * Issued token pair for a user.
 *
 * @typedef {Object} TokenPair
 * @property {string} accessToken - Short-lived JWT access token.
 * @property {string} refreshToken - Long-lived opaque refresh token.
 */

/**
 * Issues a fresh access and refresh token pair for a user and persists the
 * refresh token server-side.
 *
 * @param {{ id: number | string, email: string }} user - Minimal user payload.
 * @returns {Promise<TokenPair>} Newly issued tokens.
 */
export async function issueTokenPair(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  return { accessToken, refreshToken };
}

