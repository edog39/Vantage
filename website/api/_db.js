/**
 * _db.js
 *
 * Shared database connection helper for all Vercel serverless API routes.
 * Uses Neon's serverless driver for HTTP-based Postgres access.
 * The underscore prefix prevents Vercel from treating this as an endpoint.
 *
 * Exports: sql — a tagged-template query function bound to the DATABASE_URL env var.
 */

import { neon } from "@neondatabase/serverless";

/**
 * Creates and returns a Neon SQL query function.
 * Reads the DATABASE_URL environment variable set in Vercel.
 * @returns {Function} Tagged-template SQL function for executing queries
 */
export const sql = neon(process.env.DATABASE_URL);
