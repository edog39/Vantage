/**
 * signup.js
 *
 * Vercel serverless API route for user registration.
 * Hashes password with bcrypt, inserts into users table, initializes
 * stats and preferences, and returns access and refresh tokens so both
 * the website and the Chrome extension can authenticate against a
 * shared backend.
 *
 * Design follows backend-architect principles:
 * - Password hashed at rest (bcrypt)
 * - Input validation and sanitization
 * - Idempotent-friendly upsert by email
 * - Consistent with existing users.js patterns
 *
 * POST /api/auth/signup
 * Body: { email: string, name: string, password: string, role?: "student" | "business" }
 * Success 200: { user: { id, email, name, role }, token: string }
 * Error 400: { error: string } — validation
 * Error 409: { error: string } — email already registered
 */

import { sql } from "../_db.js";
import { cors } from "../_cors.js";
import bcrypt from "bcryptjs";
import { issueTokenPair } from "../_auth.js";
const BCRYPT_ROUNDS = 10;
const ALLOWED_ROLES = ["student", "business"];

/**
 * Validates and sanitizes signup request body.
 * @param {unknown} body - Raw request body
 * @returns {Object} Parsed fields or { error: string }
 */
function parseBody(body) {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be JSON with email, name, and password" };
  }
  const { email, name, password, role } = body;
  if (typeof email !== "string" || typeof name !== "string" || typeof password !== "string") {
    return { error: "email, name, and password are required" };
  }
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  if (!trimmedEmail) {
    return { error: "email is required" };
  }
  if (trimmedName.length < 2) {
    return { error: "name must be at least 2 characters" };
  }
  if (password.length < 6) {
    return { error: "password must be at least 6 characters" };
  }
  const safeRole = ALLOWED_ROLES.includes(role) ? role : "student";
  return { email: trimmedEmail, name: trimmedName, password, role: safeRole };
}

/**
 * Main request handler for POST /api/auth/signup.
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
    const { email, name, password, role } = parsed;

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const users = await sql`
      INSERT INTO users (email, name, role, password_hash)
      VALUES (${email}, ${name}, ${role}, ${passwordHash})
      RETURNING id, email, name, role
    `;
    const user = users[0];

    await Promise.all([
      sql`INSERT INTO stats (user_id) VALUES (${user.id}) ON CONFLICT (user_id) DO NOTHING`,
      sql`INSERT INTO preferences (user_id) VALUES (${user.id}) ON CONFLICT (user_id) DO NOTHING`,
    ]);

    // Issue a fresh access/refresh token pair for the new user.
    const { accessToken, refreshToken } = await issueTokenPair({
      id: user.id,
      email: user.email,
    });

    // For backward compatibility with any existing clients, also return `token`
    // as an alias of the short-lived access token.
    res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
      token: accessToken,
    });
  } catch (err) {
    console.error("Signup API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
