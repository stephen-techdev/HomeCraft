// Central API configuration. Frontend currently uses local mock data.
// Point VITE_API_URL at a FastAPI backend later; endpoints mirror the planned contract.
const configuredBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
// On localhost the backend is called directly (VITE_API_URL). Any other origin
// (Cloudflare tunnel, production) must call same-origin so requests route through
// the Vite proxy — an external browser has no localhost:8000 of its own.
const onLocalOrigin =
  typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
export const API_BASE = onLocalOrigin ? configuredBase : '';

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
