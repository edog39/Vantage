/**
 * _cors.js
 *
 * Shared CORS helper for Vercel serverless functions.
 * Allows requests from the Chrome extension and the Vercel-hosted website.
 * The underscore prefix prevents Vercel from treating this as an endpoint.
 *
 * Exports: cors — middleware that sets CORS headers and handles OPTIONS preflight.
 */

/**
 * Sets CORS headers on the response and handles OPTIONS preflight requests.
 * Allows any origin so the Chrome extension (chrome-extension://*) and
 * the website domain can both reach the API.
 *
 * @param {Request}  req - Incoming Vercel request
 * @param {Response} res - Vercel response object
 * @returns {boolean} true if this was a preflight (caller should return early)
 */
export function cors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}
