/**
 * preferences.js
 *
 * Vercel serverless API route for user preferences.
 * Handles fetching and updating display/sort preferences.
 *
 * Routes:
 *   GET /api/preferences?userId=...  — Fetch preferences for a user
 *   PUT /api/preferences             — Update preferences
 */

import { sql } from "./_db.js";
import { cors } from "./_cors.js";

/**
 * Main request handler for the /api/preferences endpoint.
 *
 * @param {Object} req - Vercel request object
 * @param {Object} res - Vercel response object
 */
export default async function handler(req, res) {
  if (cors(req, res)) return;

  try {
    if (req.method === "GET") {
      return await getPreferences(req, res);
    }

    if (req.method === "PUT") {
      return await updatePreferences(req, res);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Preferences API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Fetches preferences for a given user.
 *
 * @param {Object} req - Request with query param: userId
 * @param {Object} res - Response with preferences object
 */
async function getPreferences(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // sql() — Neon tagged-template query function (from _db.js)
  const prefs = await sql`SELECT * FROM preferences WHERE user_id = ${userId}`;

  if (prefs.length === 0) {
    return res.status(404).json({ error: "Preferences not found" });
  }

  res.status(200).json({ preferences: prefs[0] });
}

/**
 * Updates preferences for a given user.
 * Only provided fields are updated; others remain unchanged.
 *
 * @param {Object} req - Request with body: { userId, sortBy?, filterCategory?, darkMode? }
 * @param {Object} res - Response with the updated preferences
 */
async function updatePreferences(req, res) {
  const { userId, sortBy, filterCategory, darkMode } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

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
