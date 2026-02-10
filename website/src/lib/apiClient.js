/**
 * apiClient.js
 *
 * Small fetch wrapper for the Vantage website app area.
 * Centralizes:
 * - Authorization header injection (JWT from session storage)
 * - JSON request/response handling
 * - Consistent error shapes for UI consumption
 *
 * Note: Your current API routes do not enforce JWT auth yet, but this
 * wrapper prepares the frontend for when you add server-side checks.
 */

import { getToken } from "./session";

/**
 * ApiError — Normalized API error used by UI layers.
 *
 * @param {string} message - Human-readable error message
 * @param {number} status - HTTP status code
 * @param {any} details - Optional parsed response body
 */
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * requestJson — Performs a JSON fetch request and returns parsed JSON.
 *
 * @param {string} url - Request URL (relative to site origin is fine)
 * @param {{ method?: string, body?: any, headers?: Record<string, string> }} options - Request options
 * @returns {Promise<any>} Parsed JSON response
 * @throws {ApiError} When response is not ok
 */
export async function requestJson(url, options = {}) {
  const token = getToken();
  const method = options.method || (options.body ? "POST" : "GET");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // fetch() — Browser networking primitive. Inputs: (url, init). Output: Response.
  const res = await fetch(url, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data;
}

