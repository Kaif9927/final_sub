/**
 * Static-site deploy: set window.__API_BASE__ to your backend origin (no trailing slash), e.g.
 *   https://your-api.onrender.com
 * Render Static Site build can emit this file from an env var (see README).
 * Same-origin (UI + API together): leave unset or empty.
 */
window.__API_BASE__ = window.__API_BASE__ || '';

function apiUrl(path) {
  const base = String(window.__API_BASE__ || '')
    .trim()
    .replace(/\/$/, '');
  if (path == null || path === '') return '';
  const s = String(path);
  if (/^https?:\/\//i.test(s)) return s;
  const p = s.startsWith('/') ? s : '/' + s;
  return base ? base + p : p;
}
