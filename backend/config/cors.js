/**
 * Credentialed CORS for split UI + API. Answers OPTIONS immediately so preflight
 * never hits session/DB (avoids missing ACAO headers on slow/failed downstream).
 *
 * Env (any; comma-separated ok for ALLOWED_ORIGINS): ALLOWED_ORIGINS, CORS_ORIGIN,
 * FRONTEND_ORIGIN, ALLOWED_ORIGIN
 */
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
    process.env.FRONTEND_ORIGIN,
    process.env.ALLOWED_ORIGIN
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

const ALLOW_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'Cache-Control',
  'Pragma'
].join(', ');

/**
 * @returns {import('express').RequestHandler}
 */
function createCorsMiddleware() {
  return function corsMiddleware(req, res, next) {
    const allowed = getAllowedOrigins();
    if (allowed.length === 0) {
      return next();
    }

    const origin = req.headers.origin;
    if (!origin) {
      return next();
    }

    const normalized = normalizeOrigin(origin);
    if (!allowed.includes(normalized)) {
      console.warn('[cors] blocked Origin:', normalized, 'allowlist:', allowed);
      return next();
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', ALLOW_HEADERS);
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    }

    next();
  };
}

module.exports = {
  createCorsMiddleware,
  getAllowedOrigins,
  normalizeOrigin
};
