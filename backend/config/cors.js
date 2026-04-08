/**
 * Cross-origin rules for credentialed requests (session cookies):
 * - Never use Access-Control-Allow-Origin: * with credentials.
 * - Reflect only origins listed in ALLOWED_ORIGINS (comma-separated, normalized).
 * - If unset/empty, no cross-origin CORS headers are sent (same-site / direct API use only).
 *
 * Also reads CORS_ORIGIN or FRONTEND_ORIGIN (single origin) if ALLOWED_ORIGINS is empty — helpful when the dashboard name is misremembered.
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
  const raw = [
    process.env.ALLOWED_ORIGINS,
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_ORIGIN
  ]
    .filter(Boolean)
    .join(',');

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeOrigin)
    .filter(Boolean);
}

/**
 * @returns {import('express').RequestHandler}
 */
function createCorsMiddleware() {
  return cors({
    origin(origin, callback) {
      const allowed = getAllowedOrigins();
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
      console.warn('[cors] blocked request Origin:', normalized, '— allowlist:', allowed);
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
