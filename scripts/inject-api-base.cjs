/**
 * Static-site build: set API base in a copy of frontend/public/js/api-config.js (e.g. dist/js/api-config.js).
 * Usage: API_BASE_URL=https://api.example.com node scripts/inject-api-base.cjs path/to/api-config.js
 *
 * Also reads VITE_API_URL or REACT_APP_API_URL if API_BASE_URL is unset (common copy-paste mistakes).
 */
const fs = require('fs');

const target = process.argv[2];
if (!target) {
  console.error('Usage: API_BASE_URL=<backend-origin> node scripts/inject-api-base.cjs <path-to-api-config.js>');
  process.exit(1);
}

const url =
  process.env.API_BASE_URL ||
  process.env.VITE_API_URL ||
  process.env.REACT_APP_API_URL ||
  '';

let s = fs.readFileSync(target, 'utf8');
const normalized = s.replace(/\r\n/g, '\n');
let replaced = false;
const out = normalized
  .split('\n')
  .map((line) => {
    if (/^\s*window\.__API_BASE__\s*=/.test(line)) {
      replaced = true;
      return `window.__API_BASE__ = ${JSON.stringify(url)};`;
    }
    return line;
  })
  .join('\n');

if (!replaced) {
  console.error('inject-api-base: no line matching window.__API_BASE__ = ... in', target);
  process.exit(1);
}

fs.writeFileSync(target, out, 'utf8');
if (!url) {
  console.warn('inject-api-base: API_BASE_URL was empty; dist will call /api on the static host (login will fail). Set API_BASE_URL on the Static Site and redeploy.');
}
