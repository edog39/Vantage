/**
 * canvasApi.js
 *
 * Canvas LMS REST API integration module for Vantage.
 * Handles all communication with a Canvas LMS instance, including
 * fetching courses, assignments, and TODO items, then converting
 * them into the standard Vantage task format for unified rendering.
 *
 * All API calls are made directly from the Chrome extension to the
 * user's Canvas instance using a personal access token for auth.
 *
 * Exports: CanvasAPI object with connection test, data-fetching,
 *          and sync-all orchestrator methods.
 */

const CanvasAPI = (() => {

  /* ══════════════════════════════════════
     Internal Helpers
     ══════════════════════════════════════ */

  /**
   * Normalizes a Canvas base URL by stripping trailing slashes
   * and ensuring it starts with https://.
   * @param {string} rawUrl - The raw Canvas URL from user input
   * @returns {string} Cleaned base URL (e.g. "https://school.instructure.com")
   */
  function normalizeUrl(rawUrl) {
    let url = rawUrl.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    return url;
  }

  /**
   * Makes an authenticated GET request to the Canvas REST API.
   * Handles pagination by following Link headers when present.
   * @param {string} canvasUrl - Base Canvas URL
   * @param {string} token     - Canvas personal access token
   * @param {string} endpoint  - API path (e.g. "/api/v1/courses")
   * @param {Object} [params]  - Optional query parameters as key-value pairs
   * @returns {Promise<Array|Object>} Parsed JSON response
   */
  async function apiGet(canvasUrl, token, endpoint, params = {}) {
    const base = normalizeUrl(canvasUrl);
    const url = new URL(endpoint, base);

    // Append query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    // Request with a generous per_page to reduce pagination calls
    if (!url.searchParams.has("per_page")) {
      url.searchParams.set("per_page", "100");
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Canvas API ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Makes a paginated GET request, following Canvas Link headers
   * to collect all pages of results into a single array.
   * @param {string} canvasUrl - Base Canvas URL
   * @param {string} token     - Canvas personal access token
   * @param {string} endpoint  - API path
   * @param {Object} [params]  - Optional query parameters
   * @returns {Promise<Array>} Combined array of all pages
   */
  async function apiGetAll(canvasUrl, token, endpoint, params = {}) {
    const base = normalizeUrl(canvasUrl);
    const url = new URL(endpoint, base);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    if (!url.searchParams.has("per_page")) {
      url.searchParams.set("per_page", "100");
    }

    let allResults = [];
    let nextUrl = url.toString();

    // Follow pagination links until no more pages remain
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Canvas API ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        allResults = allResults.concat(data);
      }

      // Parse the Link header for the "next" page URL
      nextUrl = parseLinkHeader(response.headers.get("Link"));
    }

    return allResults;
  }

  /**
   * Parses the Canvas Link header to extract the "next" page URL.
   * Canvas uses RFC 5988 Link headers for pagination.
   * @param {string|null} linkHeader - The raw Link header string
   * @returns {string|null} URL for the next page, or null if none
   */
  function parseLinkHeader(linkHeader) {
    if (!linkHeader) return null;

    // Look for rel="next" in the Link header
    const parts = linkHeader.split(",");
    for (const part of parts) {
      const match = part.match(/<([^>]+)>;\s*rel="next"/);
      if (match) return match[1];
    }
    return null;
  }

  /* ══════════════════════════════════════
     Public API Methods
     ══════════════════════════════════════ */

  /**
   * Tests the Canvas connection by fetching the authenticated user's profile.
   * Used during onboarding to validate credentials before saving.
   * @param {string} canvasUrl - Base Canvas URL (e.g. "https://school.instructure.com")
   * @param {string} token     - Canvas personal access token
   * @returns {Promise<Object>} Object with { success: boolean, user?: Object, error?: string }
   */
  async function testConnection(canvasUrl, token) {
    try {
      const user = await apiGet(canvasUrl, token, "/api/v1/users/self");
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name || user.short_name || "Canvas User",
          email: user.primary_email || user.email || null
        }
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || "Could not connect to Canvas"
      };
    }
  }

  /**
   * Fetches all active courses for the authenticated user.
   * Filters to only currently active enrollments.
   * @param {string} canvasUrl - Base Canvas URL
   * @param {string} token     - Canvas personal access token
   * @returns {Promise<Array<Object>>} Array of simplified course objects
   */
  async function fetchCourses(canvasUrl, token) {
    const raw = await apiGetAll(canvasUrl, token, "/api/v1/courses", {
      enrollment_state: "active",
      state: "available",
      include: "term"
    });

    // Map to a simpler structure, filtering out courses without names
    return raw
      .filter(c => c.name && !c.access_restricted_by_date)
      .map(c => ({
        id: c.id,
        name: c.name,
        code: c.course_code || c.name,
        color: generateCourseColor(c.id)
      }));
  }

  /**
   * Fetches all assignments for a specific course.
   * Only includes assignments that have not been submitted or are still open.
   * @param {string} canvasUrl - Base Canvas URL
   * @param {string} token     - Canvas personal access token
   * @param {number} courseId  - The Canvas course ID
   * @returns {Promise<Array<Object>>} Array of raw Canvas assignment objects
   */
  async function fetchAssignments(canvasUrl, token, courseId) {
    return apiGetAll(canvasUrl, token, `/api/v1/courses/${courseId}/assignments`, {
      order_by: "due_at",
      include: "submission"
    });
  }

  /**
   * Fetches the user's Canvas TODO items (upcoming assignments/events).
   * @param {string} canvasUrl - Base Canvas URL
   * @param {string} token     - Canvas personal access token
   * @returns {Promise<Array<Object>>} Array of Canvas TODO objects
   */
  async function fetchTodoItems(canvasUrl, token) {
    return apiGetAll(canvasUrl, token, "/api/v1/users/self/todo");
  }

  /**
   * Master sync function: fetches all courses, then all assignments
   * across all courses, and converts them into the unified Vantage
   * task format. This is the main entry point for student data loading.
   *
   * @param {string} canvasUrl - Base Canvas URL
   * @param {string} token     - Canvas personal access token
   * @returns {Promise<Object>} { tasks: Array<Object>, courses: Array<Object>, syncedAt: string }
   */
  async function syncAllTasks(canvasUrl, token) {
    // Step 1: Fetch all active courses
    const courses = await fetchCourses(canvasUrl, token);

    // Step 2: Fetch assignments from each course in parallel
    const assignmentPromises = courses.map(course =>
      fetchAssignments(canvasUrl, token, course.id)
        .then(assignments => assignments.map(a => ({ ...a, _courseName: course.name, _courseId: course.id, _courseColor: course.color })))
        .catch(() => []) // Gracefully skip courses that fail
    );

    const allAssignmentArrays = await Promise.all(assignmentPromises);
    const allAssignments = allAssignmentArrays.flat();

    // Step 3: Convert each Canvas assignment to a Vantage task
    const tasks = allAssignments
      .filter(a => !isAssignmentCompleted(a)) // Only incomplete assignments
      .map(a => canvasAssignmentToTask(a));

    return {
      tasks,
      courses,
      syncedAt: new Date().toISOString()
    };
  }

  /* ══════════════════════════════════════
     Conversion Helpers
     ══════════════════════════════════════ */

  /**
   * Checks whether a Canvas assignment has already been submitted/completed.
   * @param {Object} assignment - Raw Canvas assignment object (with submission included)
   * @returns {boolean} True if the assignment is considered done
   */
  function isAssignmentCompleted(assignment) {
    const sub = assignment.submission;
    if (!sub) return false;

    // Submitted and graded, or the workflow is "complete"
    if (sub.workflow_state === "graded" && sub.score !== null) return true;
    if (sub.workflow_state === "complete") return true;

    return false;
  }

  /**
   * Converts a single Canvas assignment into the Vantage task format.
   * Maps Canvas data to the fields used by popup.js for rendering.
   * @param {Object} assignment - Raw Canvas assignment with _courseName, _courseId, _courseColor injected
   * @returns {Object} Vantage-formatted task object
   */
  function canvasAssignmentToTask(assignment) {
    const dueDate = assignment.due_at || null;
    const priority = computePriority(dueDate);

    return {
      id: `canvas_${assignment.id}`,
      title: assignment.name || "Untitled Assignment",
      category: assignment._courseName || "Unknown Course",
      categoryColor: assignment._courseColor || "#6366f1",
      courseId: assignment._courseId,
      priority,
      dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString(), // Default 30 days if no due date
      createdAt: assignment.created_at || new Date().toISOString(),
      completed: false,
      completedAt: null,
      parentId: null,
      templateKey: null,
      context: {},
      // Canvas-specific fields
      source: "canvas",
      canvasId: assignment.id,
      assignmentType: assignment.submission_types ? assignment.submission_types.join(", ") : "assignment",
      points: assignment.points_possible || null,
      htmlUrl: assignment.html_url || null,
      description: assignment.description || null,
      submissionStatus: assignment.submission ? assignment.submission.workflow_state : null
    };
  }

  /**
   * Computes a priority level based on how close the due date is.
   * - Overdue: critical
   * - Within 2 days: high
   * - Within 7 days: medium
   * - Beyond 7 days or no date: low
   * @param {string|null} dueDateStr - ISO date string or null
   * @returns {string} Priority id ("critical"|"high"|"medium"|"low")
   */
  function computePriority(dueDateStr) {
    if (!dueDateStr) return "low";

    const now = new Date();
    const due = new Date(dueDateStr);
    const diffMs = due - now;
    const diffDays = diffMs / 86400000;

    if (diffDays < 0) return "critical";     // Overdue
    if (diffDays <= 2) return "high";         // Due within 2 days
    if (diffDays <= 7) return "medium";       // Due within a week
    return "low";                             // More than a week away
  }

  /**
   * Generates a consistent color for a course based on its ID.
   * Uses a predefined palette so each course gets a distinct hue.
   * @param {number} courseId - The Canvas course ID
   * @returns {string} Hex color string
   */
  function generateCourseColor(courseId) {
    const palette = [
      "#6366f1", "#f59e0b", "#10b981", "#ec4899",
      "#14b8a6", "#8b5cf6", "#3b82f6", "#f97316",
      "#ef4444", "#84cc16", "#06b6d4", "#e879f9"
    ];
    return palette[courseId % palette.length];
  }

  /* ══════════════════════════════════════
     Public API
     ══════════════════════════════════════ */

  return {
    testConnection,
    fetchCourses,
    fetchAssignments,
    fetchTodoItems,
    syncAllTasks
  };

})();
