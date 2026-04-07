# deployed link
https://acxiom-consulting-private-limited-1.onrender.com/

# Event Management System

**Live app (Render):** [https://acxiom-consulting-private-limited-1.onrender.com/](https://acxiom-consulting-private-limited-1.onrender.com/)

Express + **PostgreSQL** with **session auth**: memberships, events, bookings, and a **marketplace** (**admin**, **vendor**, **user**)—vendors, products, cart, checkout, orders, guest list, maintenance.

## Project structure

| Folder | What it holds |
|--------|----------------|
| **`backend/`** | Node.js + Express: `server.js`, routes, controllers, DB config, `package.json` |
| **`frontend/`** | UI: `views/` (HTML pages), `public/` (CSS, JS, flowchart, assets) |
| **`database/`** | `init_pg.sql` (schema + seed for PostgreSQL) |

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Render Postgres)

## Database setup

### PostgreSQL (Render or local)

1. Create a Postgres database (e.g. **Render Postgres** → copy **External Database URL**).
2. Set **`DATABASE_URL`** on the Web Service (and in local `backend/.env`). If you only have **`DB_URL`** in Render, that works too—the app reads **`DATABASE_URL` or `DB_URL`**. See `backend/.env.example`.
3. Apply schema + seed **once**:

```bash
psql "$DATABASE_URL" -f database/init_pg.sql
```

(Install PostgreSQL client tools, or use Render’s **Shell** on the Postgres instance with the file checked in.)

The app uses **`pg`** and **`DATABASE_URL`** only for connections (no `DB_HOST` / `DB_PORT` for Postgres). Sessions are stored in Postgres (**`session`** table, created automatically by `connect-pg-simple`) so logins survive restarts and load-balanced instances on Render.

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

### Deploy on Render (example)

**Web service:** Root Directory `backend`, Build `npm install`, Start `npm start`. Render sets `PORT` automatically.

**Postgres (recommended):** Create **Render Postgres**, then on the **Web Service** set:

| Name | Value |
|------|--------|
| `DATABASE_URL` | **External Database URL** from the Postgres dashboard (include `?sslmode=require` if offered; the app also enables TLS for `*.render.com` URLs). |
| `SESSION_SECRET` | Long random string |
| `ALLOWED_ORIGINS` | Web Service origin, e.g. `https://acxiom-consulting-private-limited-1.onrender.com` |

Run **`database/init_pg.sql`** once against that database (see [Database setup](#database-setup)). Remove old **`DB_*`** / SkySQL variables if you were using MariaDB before.

**Login / “Network problem”:** Use the **Node Web Service** URL (not a separate Static Site) so `/api/login` exists. Check `GET /api/health`.

### Demo accounts (after `database/init_pg.sql`)

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

- **CORS**: Middleware in `server.js` reflects `ALLOWED_ORIGINS` for `Access-Control-Allow-Origin`, credentials, methods, headers, and answers `OPTIONS` preflight when the request `Origin` is in that list.
- Session cookie: `connect.sid`, ~30 min idle (`backend/server.js`).
- **Auth**: `POST /api/login`, `POST /api/register`, `POST /api/logout`, `GET /api/session` (login may send `expectedRole` to enforce portal).
- **Shop (customer)**: e.g. `GET /api/shop/vendors`, `GET /api/shop/products`, cart under `/api/shop/cart`, checkout `/api/shop/checkout`, guests `/api/shop/guests`, orders and item requests under `/api/shop/...`.
- **Vendor portal**: `/api/vendor/...` (profile, products, orders, fulfillment status, vendor-side item requests).
- **Admin marketplace**: `/api/admin/market/users`, `/api/admin/market/vendors` (CRUD).
- **Legacy admin**: memberships under `/api/memberships`, etc.

See route files in `backend/routes/` for exact paths and methods.
