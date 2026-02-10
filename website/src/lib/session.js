/**
 * session.js
 *
 * Centralized session + onboarding storage utilities for the Vantage website.
 * This module provides a single, consistent way to:
 * - Store and retrieve the auth token and user object
 * - Store and retrieve onboarding progress and answers
 * - Clear session state on logout
 *
 * The storage backend is `localStorage` (fast, simple). When you're ready
 * to sync onboarding across devices, you can keep the same function
 * signatures and swap implementations to call your API.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * Storage keys
 * ──────────────────────────────────────────────────────────────────────────── */

const KEYS = {
  token: "vantage_token",
  user: "vantage_user",
  onboarding: "vantage_onboarding",
  onboardingComplete: "vantage_onboarding_completed",
};

/**
 * safeJsonParse — Parses a JSON string safely.
 *
 * @param {string | null} raw - Raw JSON string
 * @param {any} fallback - Value returned when parsing fails
 * @returns {any} Parsed JSON or fallback
 */
function safeJsonParse(raw, fallback) {
  if (typeof raw !== "string" || !raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * getToken — Returns the stored JWT token (if any).
 *
 * @returns {string | null} The token or null
 */
export function getToken() {
  return localStorage.getItem(KEYS.token);
}

/**
 * setToken — Stores a JWT token (or clears it when null/empty).
 *
 * @param {string | null | undefined} token - JWT token
 * @returns {void}
 */
export function setToken(token) {
  if (!token) {
    localStorage.removeItem(KEYS.token);
    return;
  }
  localStorage.setItem(KEYS.token, token);
}

/**
 * getUser — Returns the stored user object.
 *
 * @returns {{ id?: number|string, email?: string, name?: string, role?: string } | null}
 * User object or null
 */
export function getUser() {
  return safeJsonParse(localStorage.getItem(KEYS.user), null);
}

/**
 * setUser — Stores the user object (or clears it when null).
 *
 * @param {object | null | undefined} user - User object to store
 * @returns {void}
 */
export function setUser(user) {
  if (!user) {
    localStorage.removeItem(KEYS.user);
    return;
  }
  localStorage.setItem(KEYS.user, JSON.stringify(user));
}

/**
 * isAuthed — Simple auth check used for route guards.
 *
 * @returns {boolean} True when a token exists
 */
export function isAuthed() {
  return !!getToken();
}

/**
 * getOnboarding — Returns saved onboarding answers/state.
 *
 * @returns {object | null} Onboarding payload or null
 */
export function getOnboarding() {
  return safeJsonParse(localStorage.getItem(KEYS.onboarding), null);
}

/**
 * setOnboarding — Persists onboarding answers/state.
 *
 * @param {object} payload - Onboarding data to store (JSON-serializable)
 * @returns {void}
 */
export function setOnboarding(payload) {
  localStorage.setItem(KEYS.onboarding, JSON.stringify(payload || {}));
}

/**
 * getOnboardingCompleted — Returns whether onboarding is complete.
 *
 * @returns {boolean} True when onboarding is marked complete
 */
export function getOnboardingCompleted() {
  return localStorage.getItem(KEYS.onboardingComplete) === "true";
}

/**
 * setOnboardingCompleted — Marks onboarding as complete/incomplete.
 *
 * @param {boolean} completed - Completion flag
 * @returns {void}
 */
export function setOnboardingCompleted(completed) {
  localStorage.setItem(KEYS.onboardingComplete, completed ? "true" : "false");
}

/**
 * clearSession — Clears token, user, and onboarding state.
 *
 * @returns {void}
 */
export function clearSession() {
  localStorage.removeItem(KEYS.token);
  localStorage.removeItem(KEYS.user);
  localStorage.removeItem(KEYS.onboarding);
  localStorage.removeItem(KEYS.onboardingComplete);
}

