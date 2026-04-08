/**
 * Static-site build: set API base in frontend/public/js/api-config.js copy.
 * Usage: API_BASE_URL=https://api.example.com node scripts/inject-api-base.cjs path/to/dist/js/api-config.js
 */
const fs = require('fs');

const target = process.argv[2];
if (!target) {
  console.error('Usage: API_BASE_URL=<backend-origin> node scripts/inject-api-base.cjs <path-to-api-config.js>');
  process.exit(1);
}

const url = process.env.API_BASE_URL || '';
let s = fs.readFileSync(target, 'utf8');
s = s.replace(
  /window\.__API_BASE__\s*=\s*window\.__API_BASE__\s*\|\|\s*'';/,
  `window.__API_BASE__ = ${JSON.stringify(url)};`
);
fs.writeFileSync(target, s);
