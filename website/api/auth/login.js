/**
 * login.js
 *
 * Vercel serverless API route for user authentication.
 * Validates email/password against the users table, returns access and refresh
 * tokens on success so both the website and the Chrome extension can
 * authenticate against a shared backend.
 *
 * Design follows backend-architect principles:
 * - JWT for stateless auth (horizontal scaling)
 * - bcrypt for secure password verification
 * - Input validation and sanitization
 * - Clear RESTful contract with typed status codes
 *
 * POST /api/auth/login
 * Body: { email: string, password: string }
 * Success 200: { user: { id, email, name, role }, token: string }
 * Error 400: { error: string } — validation
 * Error 401: { error: string } — invalid credentials
 */

import { sql } from "../_db.js";
import { cors } from "../_cors.js";
import bcrypt from "bcryptjs";
import { issueTokenPair, signAccessToken } from "../_auth.js";

/**
 * Validates and sanitizes login request body.
 * @param {unknown} body - Raw request body
 * @returns {{ email: string, password: string } | { error: string }}
 */
function parseBody(body) {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be JSON with email and password" };
  }
  const { email, password } = body;
  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "email and password are required" };
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    return { error: "email is required" };
  }
  if (!password) {
    return { error: "password is required" };
  }
  return { email: trimmedEmail, password };
}

/**
 * Main request handler for POST /api/auth/login.
 *
 * @param {import("vercel").VercelRequest} req - Vercel request object
 * @param {import("vercel").VercelResponse} res - Vercel response object
 */
export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const parsed = parseBody(req.body);
    if ("error" in parsed) {
      return res.status(400).json({ error: parsed.error });
    }
    const { email, password } = parsed;

    const users = await sql`
      SELECT id, email, name, role, password_hash
      FROM users
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];
    if (!user.password_hash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    let match = false;
    try {
      match = await bcrypt.compare(password, user.password_hash);
    } catch (compareErr) {
      // Malformed hash or bcrypt error — treat as invalid credentials
      console.warn("Login bcrypt compare error:", compareErr.message);
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Issue a fresh access/refresh token pair for this user.
    let accessToken;
    let refreshToken;
    try {
      const pair = await issueTokenPair({
        id: user.id,
        email: user.email,
      });
      accessToken = pair.accessToken;
      refreshToken = pair.refreshToken;
    } catch (tokenErr) {
      console.error("Login token issuance failed:", tokenErr);
      return res.status(503).json({
        error: "Unable to complete sign-in. Please try again later.",
      });
    }

    // Ensure id is JSON-serializable (Neon/Postgres may return non-plain types)
    const serializableId =
      user.id != null
        ? typeof user.id === "string"
          ? user.id
          : String(user.id)
        : null;

    // For backward compatibility with any existing clients, also return `token`
    // as an alias of the short-lived access token.
    res.status(200).json({
      user: {
        id: serializableId,
        email: user.email ?? null,
        name: user.name ?? null,
        role: user.role ?? null,
      },
      accessToken,
      refreshToken,
      token: accessToken,
    });
  } catch (err) {
    console.error("Login API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
