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
3. **TLS (SkySQL):** download the **certificate authority chain** from the service dashboard and set **`MYSQL_SSL_CA`** to the PEM file path on your machine. If you must skip verification for a quick test only, set **`MYSQL_SSL_REJECT_UNAUTHORIZED=0`** (insecure).
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

### Deploy (example)

**Web service:** Root Directory `backend`, Build `npm install`, Start `npm start`. Set **`PORT`** via the platform (e.g. Render sets it automatically).

**Database:** Point the service at your MariaDB/MySQL instance using **`DATABASE_URL`** (`mysql://...`) or **`DB_*`** variables plus **`MYSQL_SSL_CA`** when TLS is required. Run **`database/init_mysql.sql`** once against that database.

| Name | Value |
|------|--------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Or `DATABASE_URL=mysql://...` |
| `MYSQL_SSL_CA` | Path to CA PEM (SkySQL / many managed hosts) |
| `SESSION_SECRET` | Long random string |
| `ALLOWED_ORIGINS` | Optional; comma-separated origins if UI and API differ |

**Login / “Network problem”:** The browser must reach the same origin that serves `/api/login`. Check `GET /api/health`.

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
