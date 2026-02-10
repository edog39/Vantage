/**
 * preferences.js
 *
 * Vercel serverless API route for user preferences.
 * Handles fetching and updating display/sort preferences.
 *
 * Routes:
 *   GET /api/preferences             — Fetch preferences for the authenticated user
 *   PUT /api/preferences             — Update preferences for the authenticated user
 */

import { sql } from "./_db.js";
import { cors } from "./_cors.js";
import { requireAuth } from "./_auth.js";

/**
 * Main request handler for the /api/preferences endpoint.
 *
 * @param {Object} req - Vercel request object
 * @param {Object} res - Vercel response object
 */
export default async function handler(req, res) {
  if (cors(req, res)) return;

  try {
    const auth = requireAuth(req, res);
    if (!auth) {
      return;
    }

    if (req.method === "GET") {
      return await getPreferences(req, res, auth.userId);
    }

    if (req.method === "PUT") {
      return await updatePreferences(req, res, auth.userId);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Preferences API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Fetches preferences for the authenticated user.
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response with preferences object
 * @param {number|string} userId - Authenticated user ID
 */
async function getPreferences(req, res, userId) {
  // sql() — Neon tagged-template query function (from _db.js)
  const prefs = await sql`SELECT * FROM preferences WHERE user_id = ${userId}`;

  if (prefs.length === 0) {
    return res.status(404).json({ error: "Preferences not found" });
  }

  res.status(200).json({ preferences: prefs[0] });
}

/**
 * Updates preferences for the authenticated user.
 * Only provided fields are updated; others remain unchanged.
 *
 * @param {Object} req - Request with body: { sortBy?, filterCategory?, darkMode? }
 * @param {Object} res - Response with the updated preferences
 * @param {number|string} userId - Authenticated user ID
 */
async function updatePreferences(req, res, userId) {
  const { sortBy, filterCategory, darkMode } = req.body;

  const updated = await sql`
    UPDATE preferences SET
      sort_by         = COALESCE(${sortBy ?? null}, sort_by),
      filter_category = COALESCE(${filterCategory ?? null}, filter_category),
      dark_mode       = COALESCE(${darkMode ?? null}, dark_mode)
    WHERE user_id = ${userId}
    RETURNING *
  `;

  if (updated.length === 0) {
    return res.status(404).json({ error: "Preferences not found" });
  }

  res.status(200).json({ preferences: updated[0] });
}
