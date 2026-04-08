const { loadEnv } = require('./config/loadEnv');

loadEnv();

const path = require('path');
const express = require('express');
const session = require('express-session');

const { createCorsMiddleware } = require('./config/cors');
const { pool, hasDatabaseConfig } = require('./config/db');
const authController = require('./controllers/authController');
const marketAdminController = require('./controllers/marketAdminController');

const authRoutes = require('./routes/authRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const eventRoutes = require('./routes/eventRoutes');
const vendorPortalRoutes = require('./routes/vendorPortalRoutes');
const shopRoutes = require('./routes/shopRoutes');
const marketAdminRoutes = require('./routes/marketAdminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

/** Render (and other reverse proxies): HTTPS + correct session cookies */
if (process.env.RENDER === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

/** CORS: see config/cors.js. Set ALLOWED_ORIGINS when the browser UI is on a different origin than this API. */
app.use(createCorsMiddleware());

const frontendRoot = path.join(__dirname, '..', 'frontend');
const publicRoot = path.join(frontendRoot, 'public');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** Static assets before session: no DB round-trip for /css, /js, /img (and MIME types stay correct). */
app.use(express.static(publicRoot));

const sessionOpts = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  proxy: process.env.RENDER === 'true' || process.env.NODE_ENV === 'production',
  cookie: {
    path: '/',
    maxAge: 30 * 60 * 1000,
    httpOnly: true,
    secure: process.env.RENDER === 'true' || process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
};

/** MySQL session store (express-mysql-session). Survives restarts; use MemoryStore only when DB env is missing. */
const isProdLike =
  process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

if (!hasDatabaseConfig()) {
  if (isProdLike) {
    console.error(
      '[session] MySQL not configured: set DATABASE_URL (mysql://...) or DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME. ' +
        'Without it, sessions use MemoryStore, which is unsafe for production.'
    );
    process.exit(1);
  }
  console.warn(
    '[session] MySQL not configured — using MemoryStore (local dev only). Set DB_* or DATABASE_URL in backend/.env.'
  );
} else {
  /** Reuse the same mysql2 pool as `config/db.js` so SSL (e.g. SkySQL) is applied.
   * express-mysql-session's built-in pool omits `ssl` from options and breaks TLS-only hosts.
   * Pass `pool.pool` (core callback pool): the promise wrapper rejects `query(..., cb)`. */
  const MySQLStore = require('express-mysql-session')(session);
  sessionOpts.store = new MySQLStore({ createDatabaseTable: true }, pool.pool);
}

app.use(session(sessionOpts));

/** Avoid stale cached empty API responses confusing the login UI (HTTP 200 + empty body). */
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected', routes: { postAdminVendor: true } });
  } catch (e) {
    res.status(500).json({ ok: false, db: 'error', message: e.message });
  }
});

// Registered on the app first so no sub-router can swallow POST with a 404.
app.post(
  '/api/admin/market/vendors',
  authController.requireAuth,
  authController.requireAdmin,
  marketAdminController.createVendorAdmin
);

app.use('/api', authRoutes);
app.use('/api', membershipRoutes);
app.use('/api', marketAdminRoutes);
app.use('/api', eventRoutes);
app.use('/api', vendorPortalRoutes);
app.use('/api', shopRoutes);

function sendView(name) {
  return (req, res) => {
    res.sendFile(path.join(frontendRoot, 'views', name));
  };
}

app.get('/', sendView('login.html'));
app.get('/dashboard.html', sendView('dashboard.html'));
app.get('/membership.html', sendView('membership.html'));
app.get('/reports.html', sendView('reports.html'));

app.get('/login-admin.html', sendView('login-admin.html'));
app.get('/login-vendor.html', sendView('login-vendor.html'));
app.get('/login-user.html', sendView('login-user.html'));
app.get('/signup-admin.html', sendView('signup-admin.html'));
app.get('/signup-vendor.html', sendView('signup-vendor.html'));
app.get('/signup-user.html', sendView('signup-user.html'));
app.get('/user-portal.html', sendView('user-portal.html'));
app.get('/vendors-list.html', sendView('vendors-list.html'));
app.get('/products.html', sendView('products.html'));
app.get('/cart.html', sendView('cart.html'));
app.get('/checkout.html', sendView('checkout.html'));
app.get('/success.html', sendView('success.html'));
app.get('/request-item.html', sendView('request-item.html'));
app.get('/order-status-user.html', sendView('order-status-user.html'));
app.get('/vendor-dashboard.html', sendView('vendor-dashboard.html'));
app.get('/vendor-product-status.html', sendView('vendor-product-status.html'));
app.get('/vendor-update-order.html', sendView('vendor-update-order.html'));
app.get('/admin-market.html', (req, res) => res.redirect(302, '/dashboard.html'));
app.get('/admin-users.html', (req, res) => res.redirect(302, '/membership.html'));
app.get('/admin-vendors.html', (req, res) => res.redirect(302, '/membership.html'));
app.get('/admin/vendors.html', (req, res) => res.redirect(302, '/membership.html'));
app.get('/admin_users.html', (req, res) => res.redirect(302, '/membership.html'));
app.get('/instruction.html', sendView('instruction.html'));

app.get('/flow', (req, res) => {
  res.redirect(302, '/flowchart.html');
});

app.listen(PORT, () => {
  console.log('Server up on http://localhost:' + PORT);
  console.log('Market admin POST /api/admin/market/vendors (add vendor) is active.');
});
