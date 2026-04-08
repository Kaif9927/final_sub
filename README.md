# Event Management System

**Live app (Render):** [https://acxiom-consulting-private-limited-1.onrender.com/](https://acxiom-consulting-private-limited-1.onrender.com/)

Express + **MariaDB / MySQL** with **session auth**: memberships, events, bookings, and a **marketplace** (**admin**, **vendor**, **user**)—vendors, products, cart, checkout, orders, guest list, maintenance.

## Project structure

| Folder | What it holds |
|--------|----------------|
| **`backend/`** | Node.js + Express: `server.js`, routes, controllers, DB config, `package.json` |
| **`frontend/`** | UI: `views/` (HTML pages), `public/` (CSS, JS, flowchart, assets) |
| **`database/`** | `init_mysql.sql` (schema + seed for MariaDB / MySQL); `init_pg.sql` is legacy only |

## Prerequisites

- Node.js 18+
- MariaDB or MySQL 10.4+ / 8+ (e.g. **SkySQL**, local MariaDB, managed MySQL)

## Database setup

### MariaDB / MySQL (e.g. SkySQL)

1. Create a database (empty) in your provider’s UI and note **host**, **port**, **user**, **password**, and **database name**.
2. In `backend/.env`, set either:
   - **`DATABASE_URL=mysql://user:password@host:port/database`** (URL-encode the password if it contains special characters), or
   - **`DB_HOST`**, **`DB_PORT`**, **`DB_USER`**, **`DB_PASSWORD`**, **`DB_NAME`** (often easier for SkySQL passwords with `=`, `^`, etc.).
3. **TLS (SkySQL):** download the **certificate authority chain**. Locally set **`MYSQL_SSL_CA`** to the PEM file path; on **Render** paste the full PEM into **`MYSQL_SSL_CA_PEM`**. Optional insecure fallback: **`MYSQL_SSL_REJECT_UNAUTHORIZED=0`**.
4. Apply schema + seed **once** (from repo root, adjust host/port/user/db):

```bash
mysql -h YOUR_HOST -P YOUR_PORT -u YOUR_USER -p YOUR_DATABASE < database/init_mysql.sql
```

The app uses **`mysql2`** for queries and **`express-mysql-session`** for the **`sessions`** table (created automatically if missing). Confirm **`GET /api/health`** reports DB connected. Seeded demo users use bcrypt hashes from `init_mysql.sql`.

### Other env

- **`ALLOWED_ORIGINS`** — optional comma-separated origins for CORS with credentials (production: `https://acxiom-consulting-private-limited-1.onrender.com`).

See `backend/.env.example`.

## Run the app

```bash
cd backend
npm install
npm start
```

Open `http://localhost:3000`.

### Deploy on Render (full app: API + UI)

One **Web Service** serves Express, which hosts **`/api/*`** and the **`frontend/`** pages.

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

**Environment variables:** copy from **`backend/.env.example`** into the Render dashboard (same names). Use **`MYSQL_SSL_CA_PEM`** for the SkySQL CA on Render (paste PEM text); local dev can use **`MYSQL_SSL_CA`** with a file path. Run **`database/init_mysql.sql`** once on your database. Do not set **`PORT`** (Render provides it).

Check **`GET /api/health`** after deploy. **`ALLOWED_ORIGINS`** is optional; leave unset when users open your Render URL only.

### Deploy on Render (split: Static Site UI + Web Service API)

Use this when the **HTML** is a **Static Site** (e.g. `final-sub.onrender.com`) and **`/api/*`** is only on another **Web Service**. Otherwise login fails with “empty JSON” because `POST /api/login` would hit the static host.

**Backend (Web Service, root `backend`):**

| Name | Value |
|------|--------|
| **`ALLOWED_ORIGINS`** | Your static site origin only, e.g. `https://final-sub.onrender.com` (comma-separated if several). |
| *(rest)* | Same DB / `SESSION_SECRET` / TLS vars as above. |

**Static Site (root `frontend`):**

| Name | Value |
|------|--------|
| **`API_BASE_URL`** | Your API Web Service origin, e.g. `https://your-api-service.onrender.com` (no path, no trailing slash). |

| Field | Value |
|-------|--------|
| **Build Command** | `mkdir -p dist && cp -r public/* dist/ && cp views/*.html dist/ && cp dist/login.html dist/index.html && node ../scripts/inject-api-base.cjs dist/js/api-config.js` |
| **Publish Directory** | `dist` |

Run the build from the **`frontend`** directory so paths resolve; set **`API_BASE_URL`** in the Static Site **Environment** in Render. The inject script rewrites `dist/js/api-config.js` so the browser calls the API host for `fetch` / session cookies.

**If login still says “empty JSON” on the static URL:**

1. Variables belong on the **right** service: **`API_BASE_URL`** only on the **Static Site**; **`ALLOWED_ORIGINS`** only on the **backend** Web Service (`https://your-static.onrender.com`, no trailing slash).
2. After changing env, run **Manual Deploy → Clear build cache & deploy** on the **Static Site** so the build runs again and injects `API_BASE_URL`.
3. Open `https://YOUR-STATIC.onrender.com/js/api-config.js` — the first code line should be `window.__API_BASE__ = "https://YOUR-API.onrender.com";`. If it still shows `window.__API_BASE__ || ''`, the inject step did not run or **`API_BASE_URL`** was empty during build.
4. Quick test without redeploying: in the browser console run  
   `localStorage.setItem('ems_api_base','https://YOUR-API.onrender.com'); location.reload()`  
   (then set **`ALLOWED_ORIGINS`** on the backend to your static URL if you have not already).

### Demo accounts (after `database/init_mysql.sql`)

| Role | Username | Password | Landing |
|------|-----------|----------|---------|
| Admin | `admin` | `admin123` | Any login → **`/dashboard.html`**, then Admin / Maintenance tiles |
| Vendor | `vendor1` | `vendor123` | Any login → **`/dashboard.html`**, nav **Vendor portal** |
| User | `user` | `user123` | Any login → **`/dashboard.html`**, nav **User portal** |

**Instruction** page: `/instruction.html`. **Flowchart**: `/flow` or `/flowchart.html`.

Set `SESSION_SECRET` in production.

## Key pages (marketplace)

- **Auth**: `login-admin.html`, `login-vendor.html`, `login-user.html`, `signup-*.html`
- **User**: `user-portal.html` (guest list), `vendors-list.html`, `products.html`, `cart.html`, `checkout.html`, `success.html`, `request-item.html`, `order-status-user.html`
- **Vendor**: `vendor-dashboard.html` (products CRUD), `vendor-product-status.html`, `vendor-update-order.html`
- **Admin**: `dashboard.html` (hub) with one **Maintenance** tile → `membership.html` (unified accounts table for admin/user/vendor with vendor shop columns; **Update** saves login + vendor profile; subscriptions add/extend/cancel/delete via user delete). Legacy admin URLs redirect here.

Also: `reports.html` (events / memberships).

## API overview

- **CORS**: `backend/config/cors.js` uses the `cors` package with `credentials: true` and a strict allowlist from `ALLOWED_ORIGINS` (comma-separated, normalized origins). If unset, no cross-origin CORS headers are sent. Preflight uses `OPTIONS` with `Access-Control-Max-Age` (24h).
- Session cookie: `connect.sid`, ~30 min idle (`backend/server.js`).
- **Auth**: `POST /api/login`, `POST /api/register`, `POST /api/logout`, `GET /api/session` (login may send `expectedRole` to enforce portal).
- **Shop (customer)**: e.g. `GET /api/shop/vendors`, `GET /api/shop/products`, cart under `/api/shop/cart`, checkout `/api/shop/checkout`, guests `/api/shop/guests`, orders and item requests under `/api/shop/...`.
- **Vendor portal**: `/api/vendor/...` (profile, products, orders, fulfillment status, vendor-side item requests).
- **Admin marketplace**: `/api/admin/market/users`, `/api/admin/market/vendors` (CRUD).
- **Legacy admin**: memberships under `/api/memberships`, etc.

See route files in `backend/routes/` for exact paths and methods.
