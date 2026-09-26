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
written to the uploads folder, and served back through `/uploads/{name}` with a strict filename
allow-list. `HC_UPLOADS` can point the folder at a persistent volume.

---

# Deployment

Frontend on **Vercel**, backend on **Render** — both deploy from this repository.

```
Vercel  ──(HTTPS, VITE_API_URL)──▶  Render  ──▶  /data/homecraft.db  +  /data/uploads
```

## 1. Backend → Render

`render.yaml` is a ready Blueprint.

- Dashboard: **New ▸ Blueprint** → pick `stephen-techdev/HomeCraft`, branch `main`
  (or open <https://render.com/deploy?repo=https://github.com/stephen-techdev/HomeCraft>)
- Set `HC_CORS` to your Vercel origin **and** keep the localhost defaults:
  `http://localhost:5173,https://<your-app>.vercel.app`
- Health check is `/api/health`

What the Blueprint sets for you:

| Var | Purpose |
|---|---|
| `HC_SECRET` | auto-generated JWT signing key (sessions survive restarts) |
| `HC_DB` | `/data/homecraft.db` on the persistent disk |
| `HC_UPLOADS` | `/data/uploads` on the same disk |
| `HC_CORS` | allowed browser origins — you fill this in |

> **Persistence:** Render's free tier filesystem is ephemeral, so without the disk the database
> and uploaded images are wiped on every redeploy. The `disk:` block needs a paid instance
> (`plan: starter`). Free tier also sleeps after inactivity, so the first request after a pause
> takes ~30–50 s to wake up.

## 2. Frontend → Vercel

`vercel.json` defines the build, the SPA rewrite and long-lived asset caching.

- Import the repo at <https://vercel.com/new> — framework is detected as **Vite**
  (`npm run build` → `dist`), the rewrite sends every non-file route to `index.html`
- Add one environment variable, for **all** environments:

  | Variable | Value |
  |---|---|
  | `VITE_API_URL` | `https://homecraft-api.onrender.com` (your Render URL) |

- Redeploy after adding it — the value is compiled into the bundle at build time.

### Deploy order (CORS chicken-and-egg)

1. Deploy Render first, note the URL.
2. Deploy Vercel with `VITE_API_URL` set to that URL.
3. Put the Vercel domain into Render's `HC_CORS` and save (Render restarts the service).

## API base resolution

`src/lib/api.ts` picks the backend target automatically:

| `VITE_API_URL` | Page host | Result |
|---|---|---|
| `http://localhost:8000` | localhost | direct call to the local backend |
| `http://localhost:8000` | tunnel / Vercel | ignored → same-origin `/api` via the Vite proxy |
| `https://<api-host>` | anything | direct call (Vercel → Render) |

## Security note

The seed admin account and demo data in `backend/app.py` are for local development only — change
the credentials and use a strong `HC_SECRET` before deploying anywhere public.

