/**
 * Cross-origin rules for credentialed requests (session cookies):
 * - Never use Access-Control-Allow-Origin: * with credentials.
 * - Reflect only origins listed in ALLOWED_ORIGINS (comma-separated, normalized).
 * - If ALLOWED_ORIGINS is unset/empty, no cross-origin CORS headers are sent (same-site / direct API use only).
 */
const cors = require('cors');

function normalizeOrigin(origin) {
  if (!origin || typeof origin !== 'string') {
    return '';
  }
  const t = origin.trim();
  try {
    return new URL(t).origin;
  } catch {
    return t.replace(/\/+$/, '');
  }
}

function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeOrigin);
}

/**
 * @returns {import('express').RequestHandler}
 */
function createCorsMiddleware() {
  const allowed = getAllowedOrigins();

  return cors({
    origin(origin, callback) {
      if (allowed.length === 0) {
        return callback(null, false);
      }
      if (!origin) {
        return callback(null, true);
      }
      const normalized = normalizeOrigin(origin);
      if (allowed.includes(normalized)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'Pragma'
    ],
    exposedHeaders: ['Cache-Control', 'Content-Type', 'Pragma'],
    maxAge: 86400,
    optionsSuccessStatus: 204
  });
}

module.exports = {
  createCorsMiddleware,
  getAllowedOrigins,
  normalizeOrigin
};
