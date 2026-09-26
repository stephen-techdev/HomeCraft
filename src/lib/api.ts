// Central API configuration.
//
// Three setups are supported:
//   1. local dev      VITE_API_URL=http://localhost:8000, page on localhost  -> direct call
//   2. preview tunnel VITE_API_URL unset, page on a tunnel host               -> same-origin /api
//                     (Vite proxies /api and /uploads to the local backend)
//   3. split hosting  VITE_API_URL=https://<api-host>, page anywhere         -> direct call
//                     (Vercel frontend -> Render backend)
const configured = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');
const onLocalOrigin =
  typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
const targetsLoopback = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(configured);

// A loopback API is only reachable from this machine — never point a public
// browser (tunnel / Vercel) at it, fall back to same-origin instead.
export const API_BASE = !configured
  ? (onLocalOrigin ? 'http://localhost:8000' : '')
  : (targetsLoopback && !onLocalOrigin ? '' : configured);


export const endpoints = {
  products: '/api/products',
  product: (id: string) => `/api/products/${id}`,
  categories: '/api/categories',
  register: '/api/auth/register',
  login: '/api/auth/login',
  orders: '/api/orders',
  contact: '/api/contact',
};

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}
