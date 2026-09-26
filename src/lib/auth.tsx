import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from './api';
import { useShop } from './store';

export interface AuthUser {
  id: number; full_name: string; email: string; mobile: string;
  gender: string; profile_image: string | null; created_at: string; updated_at: string;
  role: 'user' | 'admin'; status: 'active' | 'blocked' | 'muted';
}
export interface Address {
  id: number; full_name: string; mobile: string; address: string;
  city: string; state: string; pincode: string; is_default: number;
}
export interface ServerOrderItem { product_id: string; name: string; price: number; qty: number; size: string | null; color: string | null }
export interface ServerOrder { id: string; total: number; status: string; name: string; city: string; created_at: string; items: ServerOrderItem[] }

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    const e = new Error('Unable to connect to the account server. Please try again.') as ApiError;
    e.code = 'offline';
    throw e;
  }
  // A host that rewrites unknown paths to index.html (SPA fallback — e.g. the
  // Vercel frontend before VITE_API_URL points at the API) answers 200 with
  // HTML. That is not a payload: parsing it would yield a bogus user object and
  // blank the page, so report it as "offline" and let the caller handle it.
  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};
  if (res.ok && !isJson) {
    const e = new Error('The HomeCraft API is not available at this address.') as ApiError;
    e.code = 'offline';
    throw e;
  }
  if (!res.ok) {
    const detail = (data as { detail?: string | { msg?: string }[] }).detail;
    // FastAPI validation errors come as an array; surface a readable string.
    const detailStr = Array.isArray(detail) ? detail.map(d => (d as { msg: string }).msg).join(' ') : detail;
    const fallback = friendlyStatus(res.status);
    // Normalize backend's "Invalid email or password." to spec's "Invalid login credentials." so tests match.
    const msg = detailStr === 'Invalid email or password.' ? 'Invalid login credentials.' : (detailStr || fallback);
    const e = new Error(msg) as ApiError;
    e.status = res.status;
    e.code = res.status === 401 ? 'unauthorized' : res.status === 403 ? 'forbidden' : res.status === 409 ? 'conflict' : 'server';
    throw e;
  }
  return data as T;
}

export interface ApiError extends Error { status?: number; code?: 'offline' | 'unauthorized' | 'forbidden' | 'conflict' | 'server' }

function friendlyStatus(status: number): string {
  if (status === 401) return 'Invalid login credentials.';
  if (status === 403) return 'You do not have permission for that action.';
  if (status === 422) return 'Please correct the highlighted fields.';
  if (status === 429) return 'Too many attempts. Please try again later.';
  return 'Something went wrong on our side. Please try again.';
}

const withAvatar = (u: AuthUser): AuthUser =>
  u.profile_image && u.profile_image.startsWith('/uploads/')
    ? { ...u, profile_image: `${API_BASE}${u.profile_image}` }
    : u;

interface AuthState {
  user: AuthUser | null; loading: boolean; backendUp: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<AuthUser>;
  adminLogin: (email: string, password: string) => Promise<AuthUser>;
  register: (f: { full_name: string; email: string; mobile: string; gender: string; password: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (f: { full_name: string; mobile: string; gender: string }) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  addresses: Address[]; refreshAddresses: () => Promise<void>;
  saveAddress: (a: Omit<Address, 'id'>, id?: number) => Promise<void>;
  deleteAddress: (id: number) => Promise<void>;
  serverOrders: ServerOrder[]; refreshOrders: () => Promise<void>;
  /** Run action if logged in, else show the login prompt. */
  requireAuth: (action: () => void) => void;
  promptOpen: boolean; setPromptOpen: (v: boolean) => void;
  runGuestAction: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { wishlist, toggleWishlist } = useShop();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendUp, setBackendUp] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [serverOrders, setServerOrders] = useState<ServerOrder[]>([]);
  const [promptOpen, setPromptOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const wishlistRef = useRef(wishlist);
  wishlistRef.current = wishlist;

  // Session restore. A 401 here just means "logged out" — the server is up.
  // Only a network failure (or failed /api/health ping) means the backend is down.
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => { if (alive) setLoading(false); }, 2500);
    api<AuthUser>('/api/auth/me')
      .then(u => { if (alive) { setUser(withAvatar(u)); setBackendUp(true); } })
      .catch((e: unknown) => {
        if (!alive) return;
        const err = e as ApiError;
        if (err.code === 'offline') {
          fetch(`${API_BASE}/api/health`).then(r => { if (alive) setBackendUp(r.ok); }).catch(() => { if (alive) setBackendUp(false); });
        } else {
          setBackendUp(true); // 401/403/... = server answered, user simply logged out
        }
      })
      .finally(() => { if (alive) { setLoading(false); clearTimeout(t); } });
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAddresses = useCallback(async () => {
    if (!user) { setAddresses([]); return; }
    try { setAddresses(await api<Address[]>('/api/addresses')); } catch (e) {
      if ((e as ApiError).code !== 'unauthorized') console.warn(e);
      setAddresses([]);
    }
  }, [user]);

  const refreshOrders = useCallback(async () => {
    if (!user) { setServerOrders([]); return; }
    try { setServerOrders(await api<ServerOrder[]>('/api/orders')); } catch (e) {
      if ((e as ApiError).code !== 'unauthorized') console.warn(e);
      setServerOrders([]);
    }
  }, [user]);

  // On login: merge guest wishlist into server list, then adopt union.
  const syncWishlistOnLogin = useCallback(async () => {
    try {
      const server = await api<{ product_ids: string[] }>('/api/wishlist');
      const union = Array.from(new Set([...server.product_ids, ...wishlistRef.current]));
      await api('/api/wishlist', { method: 'PUT', body: JSON.stringify({ product_ids: union }) });
      union.filter(id => !wishlistRef.current.includes(id)).forEach(id => toggleWishlist(id));
    } catch { /* wishlist sync is best-effort */ }
  }, [toggleWishlist]);

  // Push wishlist changes to server while logged in (debounced).
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user || loading) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      api('/api/wishlist', { method: 'PUT', body: JSON.stringify({ product_ids: wishlistRef.current }) }).catch(() => {});
    }, 800);
  }, [wishlist, user, loading]);

  useEffect(() => { refreshAddresses(); refreshOrders(); }, [refreshAddresses, refreshOrders]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const u = await api<AuthUser>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password, remember }) });
    const w = withAvatar(u);
    setUser(w);
    await syncWishlistOnLogin();
    return w;
  }, [syncWishlistOnLogin]);

  const adminLogin = useCallback(async (email: string, password: string) => {
    const u = await api<AuthUser>('/api/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    const w = withAvatar(u);
    setUser(w);
    return w;
  }, []);

  const register = useCallback(async (f: { full_name: string; email: string; mobile: string; gender: string; password: string }) => {
    const u = await api<AuthUser>('/api/auth/register', { method: 'POST', body: JSON.stringify(f) });
    const w = withAvatar(u);
    setUser(w);
    await syncWishlistOnLogin();
    return w;
  }, [syncWishlistOnLogin]);

  const logout = useCallback(async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setUser(null); setAddresses([]); setServerOrders([]);
  }, []);

  const updateProfile = useCallback(async (f: { full_name: string; mobile: string; gender: string }) => {
    const u = await api<AuthUser>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(f) });
    setUser(withAvatar(u));
  }, []);

  const changePassword = useCallback(async (current: string, next: string) => {
    await api('/api/auth/password', { method: 'PUT', body: JSON.stringify({ current_password: current, new_password: next }) });
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    // Some pickers report .jpg files as "image/jpg" — normalise before validating.
    const type = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
      throw new Error(`That file (${file.type || 'unknown type'}) is not supported — please choose a JPG, PNG or WebP image.`);
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — please pick one under 5 MB.`);
    }
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(new Error('Could not read image.'));
      r.readAsDataURL(file);
    });
    // the API only accepts the canonical data-image prefixes
    const payload = dataUrl.replace(/^data:image\/jpg;/, 'data:image/jpeg;');
    const out = await api<{ profile_image: string }>('/api/auth/profile/image', { method: 'PUT', body: JSON.stringify({ image_data: payload }) });
    setUser(u => (u ? { ...u, profile_image: `${API_BASE}${out.profile_image}` } : u));
  }, []);

  const removeAvatar = useCallback(async () => {
    await api('/api/auth/profile/image', { method: 'DELETE' });
    setUser(u => (u ? { ...u, profile_image: null } : u));
  }, []);

  const saveAddress = useCallback(async (a: Omit<Address, 'id'>, id?: number) => {
    if (id) await api(`/api/addresses/${id}`, { method: 'PUT', body: JSON.stringify(a) });
    else await api('/api/addresses', { method: 'POST', body: JSON.stringify(a) });
    await refreshAddresses();
  }, [refreshAddresses]);

  const deleteAddress = useCallback(async (id: number) => {
    await api(`/api/addresses/${id}`, { method: 'DELETE' });
    await refreshAddresses();
  }, [refreshAddresses]);

  const requireAuth = useCallback((action: () => void) => {
    if (user) { action(); return; }
    pendingAction.current = action;
    setPromptOpen(true);
  }, [user]);

  const runGuestAction = useCallback(() => {
    setPromptOpen(false);
    pendingAction.current?.();
    pendingAction.current = null;
  }, []);

  const value: AuthState = {
    user, loading, backendUp, login, adminLogin, register, logout, updateProfile, changePassword,
    uploadAvatar, removeAvatar, addresses, refreshAddresses, saveAddress, deleteAddress,
    serverOrders, refreshOrders, requireAuth, promptOpen, setPromptOpen, runGuestAction,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside provider');
  return v;
}

/** Gate for user-only pages: redirects to login when unauthenticated. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }, [user, loading, nav]);
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-stone-500">Loading your account…</div>;
  if (!user) return null;
  return <>{children}</>;
}

/** Prompt shown when a logged-out user tries a member action. */
export function AuthPrompt() {
  const { promptOpen, setPromptOpen, runGuestAction } = useAuth();
  const nav = useNavigate();
  if (!promptOpen) return null;
  return (
    <div className="overlay-in fixed inset-0 z-50 grid place-items-center bg-[#2A1912]/60 p-4" onClick={() => setPromptOpen(false)}>
      <div className="modal-in w-full max-w-sm rounded-2xl bg-[#FFF9F0] p-7 text-center" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Login required">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EDE3D5] text-xl">♡</span>
        <h3 className="font-display mt-3 text-xl">Login to save products</h3>
        <p className="mt-1 text-sm text-stone-500">Keep your wishlist synced across devices with a free HomeCraft account.</p>
        <button onClick={() => { setPromptOpen(false); nav(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`); }}
          className="btn-lux btn-primary mt-5 w-full rounded-lg py-3 text-sm font-bold">Login / Create Account</button>
        <button onClick={runGuestAction} className="mt-2 w-full rounded-lg py-2.5 text-sm font-semibold text-stone-500 hover:text-[#241A15]">Continue as guest</button>
      </div>
    </div>
  );
}

export const firstName = (u: AuthUser) => (u?.full_name ?? '').split(' ')[0];

/** Raw API helper for admin dashboard calls (throws ApiError with status/code). */
export async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  return api<T>(path, init);
}

/** Gate for admin pages: requires a logged-in admin, else redirects to /admin/login. */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) nav('/admin/login');
    else if (user.role !== 'admin') nav('/login?next=%2Fadmin');
  }, [user, loading, nav]);
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-stone-500">Checking admin access…</div>;
  if (!user || user.role !== 'admin') return null;
  return <>{children}</>;
}

/** % profile completion + what's missing. */
export function profileCompletion(u: AuthUser, addressCount: number): { pct: number; missing: string[] } {
  const missing: string[] = [];
  if (!u.profile_image) missing.push('Add profile picture');
  if (!u.mobile) missing.push('Add mobile number');
  if (!u.gender || u.gender === 'prefer_not_to_say') missing.push('Add gender');
  if (addressCount === 0) missing.push('Add delivery address');
  const done = 5 - missing.length;
  return { pct: Math.round((done / 5) * 100), missing };
}
