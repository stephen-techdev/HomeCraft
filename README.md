# HomeCraft

Premium furniture e-commerce — React + TypeScript (Vite) storefront with a FastAPI + SQLite backend.

Furniture crafted for Indian homes: collections, per-colour variants, drag-to-rotate product
frames, wishlist, cart, checkout, reviews, contact form and a full admin dashboard.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, lucide-react |
| Backend | FastAPI, SQLite, PBKDF2-HMAC-SHA256 password hashing, JWT in an HttpOnly cookie |

## Project layout

```
backend/        FastAPI app (app.py), SQLite schema, uploads folder
src/
  components/   Navbar, Footer, ProductCard, QuickView, SearchOverlay, ui helpers
  lib/          api, auth, store (shared catalogue), data (seed catalogue), types, contact
  pages/        Home, Shop, ProductDetails, Cart, Checkout, Account, Auth, Admin, Info
public/         static assets
```

## Run locally

**1. Backend** (port `8000`)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

**2. Frontend** (port `5173`)

```bash
npm install
npm run dev -- --port 5173 --host
```

Open <http://localhost:5173>. Vite proxies `/api` and `/uploads` to `127.0.0.1:8000`, so the
frontend works from any origin (local or a tunnel). Copy `.env` from the template if you need to
point `VITE_API_URL` somewhere else.

The SQLite file (`backend/homecraft.db`) and the JWT secret (`backend/.secret`) are created on
first run and are git-ignored.

## Product catalogue

`src/lib/data.ts` holds the seed catalogue. On boot the app merges those entries with the
admin-managed rows from `/api/products` into a single shared array (`src/lib/store.tsx`), so
Shop, categories, collections, search, cart and product pages all read one source. Catalogue
products an admin deletes are remembered in the `removed_products` table and stay deleted after
a refresh.

## Uploads

Product and profile images are uploaded as data URLs, validated (JPG / PNG / WebP, size-capped),
written to `backend/uploads/`, and served back through `/uploads/{name}` with a strict filename
allow-list.

## Security note

The seed admin account and demo data in `backend/app.py` are for local development only — change
the credentials and use a strong `HC_SECRET` before deploying anywhere public.
