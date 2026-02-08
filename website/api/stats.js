/**
 * stats.js
 *
 * Vercel serverless API route for user statistics.
 * Handles fetching and updating streak/completion stats.
 *
 * Routes:
 *   GET  /api/stats?userId=...  — Fetch stats for a user
 *   POST /api/stats             — Record a task completion (updates stats)
 */

import { sql } from "./_db.js";
import { cors } from "./_cors.js";

/**
 * Main request handler for the /api/stats endpoint.
 *
 * @param {Object} req - Vercel request object
 * @param {Object} res - Vercel response object
 */
export default async function handler(req, res) {
  if (cors(req, res)) return;

  try {
    if (req.method === "GET") {
      return await getStats(req, res);
    }

    if (req.method === "POST") {
      return await recordCompletion(req, res);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Stats API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Fetches stats for a given user.
 *
 * @param {Object} req - Request with query param: userId
 * @param {Object} res - Response with the stats object
 */
async function getStats(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // sql() — Neon tagged-template query function (from _db.js)
  const stats = await sql`SELECT * FROM stats WHERE user_id = ${userId}`;

  if (stats.length === 0) {
    return res.status(404).json({ error: "Stats not found" });
  }

  res.status(200).json({ stats: stats[0] });
}

/**
 * Records a task completion — increments counters, updates streaks,
 * and tracks per-category breakdowns.
 *
 * @param {Object} req - Request with body: { userId, category, spawnedCount }
 * @param {Object} res - Response with updated stats
 */
async function recordCompletion(req, res) {
  const { userId, category, spawnedCount = 0 } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // Fetch current stats
  const current = await sql`SELECT * FROM stats WHERE user_id = ${userId}`;

  if (current.length === 0) {
    return res.status(404).json({ error: "Stats not found — create user first" });
  }

  const s = current[0];
  const today = new Date().toISOString().slice(0, 10);
  const lastActive = s.last_active_date
    ? new Date(s.last_active_date).toISOString().slice(0, 10)
    : null;

  // Calculate new streak values
  let newStreak = s.streak;
  let newCompletedToday = s.completed_today;

  if (lastActive === today) {
    // Same day — just bump the daily counter
    newCompletedToday += 1;
  } else {
    // Different day — check if yesterday (streak continues) or gap (reset)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    newStreak = lastActive === yesterdayStr ? s.streak + 1 : 1;
    newCompletedToday = 1;
  }

  const newLongest = Math.max(newStreak, s.longest_streak);

  // Update per-category breakdown (stored as JSONB)
  const catCounts = s.completed_by_category || {};
  if (category) {
    catCounts[category] = (catCounts[category] || 0) + 1;
  }

  // Persist updated stats
  const updated = await sql`
    UPDATE stats SET
      total_completed       = total_completed + 1,
      total_spawned         = total_spawned + ${spawnedCount},
      completed_by_category = ${JSON.stringify(catCounts)},
      completed_today       = ${newCompletedToday},
      last_active_date      = ${today},
      streak                = ${newStreak},
      longest_streak        = ${newLongest}
    WHERE user_id = ${userId}
    RETURNING *
  `;

  res.status(200).json({ stats: updated[0] });
}
