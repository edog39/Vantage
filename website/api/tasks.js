/**
 * tasks.js
 *
 * Vercel serverless API route for task CRUD operations.
 * Both the Chrome extension and the website use these endpoints
 * to keep task data synchronized via the Neon database.
 *
 * Routes:
 *   GET    /api/tasks?userId=...              — Fetch all tasks for a user
 *   POST   /api/tasks                         — Create a new task
 *   PUT    /api/tasks    { id, ...fields }    — Update an existing task
 *   DELETE /api/tasks?id=...                  — Delete a task by ID
 */

import { sql } from "./_db.js";
import { cors } from "./_cors.js";

/**
 * Main request handler for the /api/tasks endpoint.
 * Dispatches based on HTTP method.
 *
 * @param {Object} req - Vercel request object
 * @param {Object} res - Vercel response object
 */
export default async function handler(req, res) {
  if (cors(req, res)) return;

  try {
    switch (req.method) {
      case "GET":    return await getTasks(req, res);
      case "POST":   return await createTask(req, res);
      case "PUT":    return await updateTask(req, res);
      case "DELETE": return await deleteTask(req, res);
      default:       return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("Tasks API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Fetches all tasks for a given user, ordered by priority then due date.
 *
 * @param {Object} req - Request with query param: userId
 * @param {Object} res - Response with array of task objects
 */
async function getTasks(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // sql() — Neon tagged-template query function (from _db.js)
  const tasks = await sql`
    SELECT * FROM tasks
    WHERE user_id = ${userId}
    ORDER BY completed ASC, priority ASC, due_date ASC NULLS LAST
  `;

  res.status(200).json({ tasks });
}

/**
 * Creates a new task for a user.
 *
 * @param {Object} req - Request with body: { userId, title, category?, priority?,
 *                        dueDate?, source?, canvasAssignmentId?, parentTaskId?, metadata? }
 * @param {Object} res - Response with the newly created task
 */
async function createTask(req, res) {
  const {
    userId, title, category, priority,
    dueDate, source, canvasAssignmentId, parentTaskId, metadata
  } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: "userId and title are required" });
  }

  const tasks = await sql`
    INSERT INTO tasks (user_id, title, category, priority, due_date, source,
                       canvas_assignment_id, parent_task_id, metadata)
    VALUES (${userId}, ${title}, ${category || null}, ${priority || 3},
            ${dueDate || null}, ${source || "manual"},
            ${canvasAssignmentId || null}, ${parentTaskId || null},
            ${JSON.stringify(metadata || {})})
    RETURNING *
  `;

  res.status(201).json({ task: tasks[0] });
}

/**
 * Updates an existing task by ID.
 * Only provided fields are updated; others remain unchanged.
 *
 * @param {Object} req - Request with body: { id, ...fieldsToUpdate }
 * @param {Object} res - Response with the updated task
 */
async function updateTask(req, res) {
  const { id, title, category, priority, dueDate, completed, metadata } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Task id is required" });
  }

  const tasks = await sql`
    UPDATE tasks SET
      title     = COALESCE(${title ?? null}, title),
      category  = COALESCE(${category ?? null}, category),
      priority  = COALESCE(${priority ?? null}, priority),
      due_date  = COALESCE(${dueDate ?? null}, due_date),
      completed = COALESCE(${completed ?? null}, completed),
      metadata  = COALESCE(${metadata ? JSON.stringify(metadata) : null}, metadata),
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  if (tasks.length === 0) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.status(200).json({ task: tasks[0] });
}

/**
 * Deletes a task by ID.
 *
 * @param {Object} req - Request with query param: id
 * @param {Object} res - Response confirming deletion
 */
async function deleteTask(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Task id is required" });
  }

  const result = await sql`DELETE FROM tasks WHERE id = ${id} RETURNING id`;

  if (result.length === 0) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.status(200).json({ deleted: result[0].id });
}
