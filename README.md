# Varsha Ayurveda – E‑commerce (React + Vite + Node/Express)

This is a minimal full‑stack e‑commerce starter built from the provided **Varsha Ayurveda** product catalogue.

## Features

- React (Vite) storefront:
  - Product listing (search + category filter)
  - Product detail page
  - Cart (persistent via localStorage)
  - Checkout with payment selection:
    - Cash on Delivery (COD)
    - Razorpay Standard Checkout (online payment)
  - Order success page (shows order summary)
  - Auth:
    - Signup / Login / Logout
    - My Orders (for logged-in users)
- Node/Express API:
  - Products API
  - Orders API (stored in a local JSON database)
  - Admin:
    - Admin endpoints (JWT role-based admin OR `x-admin-key`)
    - Admin UI (Dashboard, Orders, Products)

## Tech Stack

- Frontend: React + Vite + TypeScript + React Router
- Backend: Node.js + Express (JSON file database)

## Getting Started

### 1) Install dependencies

From the repository root:

```bash
npm install
```

### 2) Configure environment

**Server**

Copy the example env and set:
 - JWT secret
 - Admin bootstrap user (recommended)
 - Razorpay keys (if you want online payments)

```bash
cp server/.env.example server/.env
```

**Client**

Copy the example env and point to your API:

```bash
cp client/.env.example client/.env
```

### 3) Run dev servers

Run both API and client:

```bash
npm run dev
```

- API: `http://localhost:4000`
- Web: `http://localhost:5173`

## API Endpoints

Public:
- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/orders`
- `GET /api/orders/:id`

Auth:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

My Orders:
- `GET /api/my/orders` (requires Bearer token)

Payments (Razorpay):
- `POST /api/payments/razorpay/create-order`
- `POST /api/payments/razorpay/verify`

Admin (JWT user.role=admin OR `x-admin-key: <ADMIN_KEY>`):
- `GET /api/admin/meta`
- `GET /api/admin/sales/summary`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PUT /api/admin/orders/:id/status`
- `PUT /api/admin/orders/:id/mark-paid`

## Data Storage

- `server/data/db.json` contains `meta`, `products`, `orders`, and `users`.

You can edit `db.json` to add prices, descriptions, etc.

## Admin login

Set these in `server/.env`:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin12345
```

On server start, if this email does not exist, an admin account will be created.

## Razorpay setup

Set these in `server/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```

Online payments require **all cart items to have a numeric price**. If some products are “Price on request”, use COD.

## Notes / Disclaimer

This demo uses product names and pack sizes from the provided catalogue images. Health‑related text is displayed as catalogue info and is **not medical advice**.


## Troubleshooting (Windows)

### If you see `Error: Cannot find module '../encodings'` (iconv-lite)

This usually means your `node_modules` install is incomplete/corrupted (commonly when the project is inside **OneDrive** and files are not fully available).

Fix:

1) Move the project **outside OneDrive**, e.g. `C:\projects\varsha-ayurveda-shop-admin-pay`

2) Delete dependencies and reinstall:

**PowerShell:**
```powershell
Remove-Item -Recurse -Force node_modules, server\node_modules, client\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json, server\package-lock.json, client\package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force
npm install
npm run dev
```

If it still happens, run:
```bash
npm install iconv-lite --force
```
