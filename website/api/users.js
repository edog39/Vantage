/**
 * users.js
 *
 * Vercel serverless API route for user management.
 * Handles creating new users and fetching user profiles.
 *
 * Routes:
 *   GET  /api/users?email=...  — Fetch a user by email
 *   POST /api/users            — Create or update a user (upsert by email)
 */

import { sql } from "./_db.js";
import { cors } from "./_cors.js";

/**
 * Main request handler for the /api/users endpoint.
 * Dispatches to GET (fetch user) or POST (create/update user).
 *
 * @param {Object} req - Vercel request object
 * @param {Object} res - Vercel response object
 */
export default async function handler(req, res) {
  if (cors(req, res)) return;

  try {
    if (req.method === "GET") {
      return await getUser(req, res);
    }

    if (req.method === "POST") {
      return await upsertUser(req, res);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Users API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Fetches a user by email address.
 * Also returns their stats and preferences in a single response.
 *
 * @param {Object} req - Request with query param: email
 * @param {Object} res - Response with user object or 404
 */
async function getUser(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Fetch user, stats, and preferences in parallel
  // sql() — Neon tagged-template query function (from _db.js)
  const users = await sql`SELECT * FROM users WHERE email = ${email}`;

  if (users.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  const user = users[0];

  // Fetch related data in parallel
  const [stats, prefs] = await Promise.all([
    sql`SELECT * FROM stats WHERE user_id = ${user.id}`,
    sql`SELECT * FROM preferences WHERE user_id = ${user.id}`
  ]);

  res.status(200).json({
    user,
    stats: stats[0] || null,
    preferences: prefs[0] || null
  });
}

/**
 * Creates a new user or updates an existing one (upsert by email).
 * Also initializes default stats and preferences rows if new.
 *
 * @param {Object} req - Request with body: { email, name, role, canvasUrl?, canvasToken? }
 * @param {Object} res - Response with the created/updated user
 */
async function upsertUser(req, res) {
  const { email, name, role, canvasUrl, canvasToken } = req.body;

  if (!email || !name || !role) {
    return res.status(400).json({ error: "email, name, and role are required" });
  }

  // Upsert user — insert or update on email conflict
  const users = await sql`
    INSERT INTO users (email, name, role, canvas_url, canvas_token)
    VALUES (${email}, ${name}, ${role}, ${canvasUrl || null}, ${canvasToken || null})
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      canvas_url = EXCLUDED.canvas_url,
      canvas_token = EXCLUDED.canvas_token,
      updated_at = now()
    RETURNING *
  `;

  const user = users[0];

  // Initialize stats and preferences if they don't exist yet
  await Promise.all([
    sql`INSERT INTO stats (user_id) VALUES (${user.id}) ON CONFLICT (user_id) DO NOTHING`,
    sql`INSERT INTO preferences (user_id) VALUES (${user.id}) ON CONFLICT (user_id) DO NOTHING`
  ]);

  res.status(200).json({ user });
}
