/**
 * storage.js
 * 
 * Abstraction layer over Chrome's storage.local API for Vantage.
 * Handles persisting tasks, stats, and user preferences.
 * All methods return Promises for clean async/await usage.
 * 
 * Exports: StorageManager object with CRUD helpers.
 */

const StorageManager = (() => {

  /* ── Storage Keys ── */
  const KEYS = {
    TASKS: "vantage_tasks",
    STATS: "vantage_stats",
    PREFERENCES: "vantage_prefs",
    INITIALIZED: "vantage_initialized",
    PROFILE: "vantage_profile",
    CANVAS_COURSES: "vantage_canvas_courses",
    CANVAS_TASKS: "vantage_canvas_tasks",
    CANVAS_SYNC_TIME: "vantage_canvas_sync_time",
    UI_STATE: "vantage_ui_state"
  };

  /* ── Default Stats Shape ── */
  const DEFAULT_STATS = {
    totalCompleted: 0,
    totalSpawned: 0,
    completedByCategory: {},
    completedToday: 0,
    lastActiveDate: new Date().toISOString().slice(0, 10),
    streak: 0,
    longestStreak: 0
  };

  /* ── Default Preferences Shape ── */
  const DEFAULT_PREFS = {
    sortBy: "priority",       // "priority" | "dueDate" | "category"
    filterCategory: "all",    // category id or "all"
    darkMode: false
  };

  /**
   * Reads a value from chrome.storage.local by key.
   * @param {string} key - The storage key to read
   * @returns {Promise<*>} The stored value, or undefined
   */
  function get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
  }

  /**
   * Writes a value to chrome.storage.local.
   * @param {string} key   - The storage key
   * @param {*}      value - The value to store
   * @returns {Promise<void>}
   */
  function set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  /**
   * Loads all active (incomplete) tasks from storage.
   * @returns {Promise<Array<Object>>} Array of task objects
   */
  async function loadTasks() {
    const tasks = await get(KEYS.TASKS);
    return tasks || [];
  }

  /**
   * Saves the full tasks array to storage (overwrites).
   * @param {Array<Object>} tasks - The complete tasks array
   * @returns {Promise<void>}
   */
  async function saveTasks(tasks) {
    return set(KEYS.TASKS, tasks);
  }

  /**
   * Loads the user's lifetime stats.
   * @returns {Promise<Object>} Stats object
   */
  async function loadStats() {
    const stats = await get(KEYS.STATS);
    return stats || { ...DEFAULT_STATS };
  }

  /**
   * Saves the user's lifetime stats.
   * @param {Object} stats - The stats object to persist
   * @returns {Promise<void>}
   */
  async function saveStats(stats) {
    return set(KEYS.STATS, stats);
  }

  /**
   * Loads user preferences.
   * @returns {Promise<Object>} Preferences object
   */
  async function loadPreferences() {
    const prefs = await get(KEYS.PREFERENCES);
    return prefs || { ...DEFAULT_PREFS };
  }

  /**
   * Saves user preferences.
   * @param {Object} prefs - The preferences object
   * @returns {Promise<void>}
   */
  async function savePreferences(prefs) {
    return set(KEYS.PREFERENCES, prefs);
  }

  /**
   * Checks whether the extension has been initialized (first run complete).
   * @returns {Promise<boolean>}
   */
  async function isInitialized() {
    const val = await get(KEYS.INITIALIZED);
    return val === true;
  }

  /**
   * Marks the extension as initialized.
   * @returns {Promise<void>}
   */
  async function markInitialized() {
    return set(KEYS.INITIALIZED, true);
  }

  /**
   * Updates stats after a task is completed.
   * Tracks per-category counts, daily counts, and streaks.
   * @param {Object} completedTask - The task that was just completed
   * @param {number} spawnedCount  - How many follow-ups were spawned
   * @returns {Promise<Object>} The updated stats object
   */
  async function recordCompletion(completedTask, spawnedCount) {
    const stats = await loadStats();
    const today = new Date().toISOString().slice(0, 10);

    stats.totalCompleted += 1;
    stats.totalSpawned += spawnedCount;

    // Per-category tracking
    if (!stats.completedByCategory[completedTask.category]) {
      stats.completedByCategory[completedTask.category] = 0;
    }
    stats.completedByCategory[completedTask.category] += 1;

    // Daily count & streak logic
    if (stats.lastActiveDate === today) {
      stats.completedToday += 1;
    } else {
      // Check if yesterday was the last active date (streak continues)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      if (stats.lastActiveDate === yesterdayStr) {
        stats.streak += 1;
      } else {
        stats.streak = 1;
      }

      stats.completedToday = 1;
      stats.lastActiveDate = today;
    }

    // Update longest streak
    if (stats.streak > stats.longestStreak) {
      stats.longestStreak = stats.streak;
    }

    await saveStats(stats);
    return stats;
  }

  /* ══════════════════════════════════════
     Profile Management
     ══════════════════════════════════════ */

  /**
   * Saves the user profile (role, name, Canvas credentials, etc.).
   * @param {Object} profile - Profile object with shape:
   *   { name: string, role: "student"|"business", canvasUrl?: string,
   *     canvasToken?: string, onboardingComplete: boolean }
   * @returns {Promise<void>}
   */
  async function saveProfile(profile) {
    return set(KEYS.PROFILE, profile);
  }

  /**
   * Loads the user profile from storage.
   * @returns {Promise<Object|null>} Profile object, or null if not set
   */
  async function getProfile() {
    const profile = await get(KEYS.PROFILE);
    return profile || null;
  }

  /**
   * Clears the user profile data. Used when switching roles.
   * Also clears Canvas-specific caches if present.
   * @returns {Promise<void>}
   */
  async function clearProfile() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(
        [KEYS.PROFILE, KEYS.CANVAS_COURSES, KEYS.CANVAS_TASKS, KEYS.CANVAS_SYNC_TIME],
        resolve
      );
    });
  }

  /* ══════════════════════════════════════
     Canvas Data Caching
     ══════════════════════════════════════ */

  /**
   * Saves cached Canvas courses for offline access.
   * @param {Array<Object>} courses - Array of simplified course objects
   * @returns {Promise<void>}
   */
  async function saveCourses(courses) {
    return set(KEYS.CANVAS_COURSES, courses);
  }

  /**
   * Loads cached Canvas courses.
   * @returns {Promise<Array<Object>>} Array of course objects, or empty array
   */
  async function getCourses() {
    const courses = await get(KEYS.CANVAS_COURSES);
    return courses || [];
  }

  /**
   * Saves Canvas assignments converted to Vantage task format.
   * @param {Array<Object>} tasks - Array of Canvas-sourced task objects
   * @returns {Promise<void>}
   */
  async function saveCanvasTasks(tasks) {
    return set(KEYS.CANVAS_TASKS, tasks);
  }

  /**
   * Loads cached Canvas tasks.
   * @returns {Promise<Array<Object>>} Array of task objects, or empty array
   */
  async function getCanvasTasks() {
    const tasks = await get(KEYS.CANVAS_TASKS);
    return tasks || [];
  }

  /**
   * Saves the timestamp of the last Canvas sync.
   * @param {string} isoTimestamp - ISO date string
   * @returns {Promise<void>}
   */
  async function saveSyncTime(isoTimestamp) {
    return set(KEYS.CANVAS_SYNC_TIME, isoTimestamp);
  }

  /**
   * Loads the timestamp of the last Canvas sync.
   * @returns {Promise<string|null>} ISO date string or null
   */
  async function getSyncTime() {
    return get(KEYS.CANVAS_SYNC_TIME) || null;
  }

  /* ══════════════════════════════════════
     UI State Persistence
     Saves the current position within the extension so that
     re-opening after clicking away restores where the user was.
     ══════════════════════════════════════ */

  /**
   * Saves a snapshot of the current UI state.
   * Called continuously (debounced) so the popup can be
   * destroyed at any moment without losing position.
   * @param {Object} state - UI state snapshot with shape:
   *   {
   *     onboarding: { step: number, role: string|null, name: string,
   *                   canvasUrl: string, canvasToken: string } | null,
   *     scrollTop: number,
   *     openModal: string|null  ("settings"|"stats"|"addTask"|null)
   *   }
   * @returns {Promise<void>}
   */
  async function saveUiState(state) {
    return set(KEYS.UI_STATE, state);
  }

  /**
   * Loads the last saved UI state snapshot.
   * @returns {Promise<Object|null>} UI state object, or null if none saved
   */
  async function loadUiState() {
    const state = await get(KEYS.UI_STATE);
    return state || null;
  }

  /**
   * Clears the saved UI state (e.g. after onboarding completes
   * or a role switch, so stale state doesn't get restored).
   * @returns {Promise<void>}
   */
  async function clearUiState() {
    return new Promise((resolve) => {
      chrome.storage.local.remove([KEYS.UI_STATE], resolve);
    });
  }

  /**
   * Completely resets all stored data (for debug/testing).
   * @returns {Promise<void>}
   */
  async function clearAll() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });
  }

  /* ── Public API ── */
  return {
    loadTasks,
    saveTasks,
    loadStats,
    saveStats,
    loadPreferences,
    savePreferences,
    isInitialized,
    markInitialized,
    recordCompletion,
    clearAll,
    // Profile methods
    saveProfile,
    getProfile,
    clearProfile,
    // Canvas cache methods
    saveCourses,
    getCourses,
    saveCanvasTasks,
    getCanvasTasks,
    saveSyncTime,
    getSyncTime,
    // UI state persistence
    saveUiState,
    loadUiState,
    clearUiState
  };

})();
