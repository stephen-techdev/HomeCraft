import { Eye, LayoutDashboard, LogOut, Mail, MessageSquare, Package, Plus, Search, ShoppingBag, Star, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLLECTIONS, PRODUCTS, inr } from '../lib/data';
import { API_BASE } from '../lib/api';
import { adminApi, useAuth } from '../lib/auth';
import { useShop } from '../lib/store';
import type { Product } from '../lib/types';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'collections', label: 'Collections', icon: Star },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
] as const;

type Tab = typeof TABS[number]['id'];
const STATUSES = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
const CAT_NAMES = ['Living Room', 'Bedroom', 'Dining', 'Home Office', 'Outdoor', 'Decor', 'Storage', 'Kids & Teens', 'Entryway', 'Premium Collection'];

interface AdminUser {
  id: number; full_name: string; email: string; mobile: string; gender: string;
  profile_image: string | null; role: string; status: string; created_at: string; last_login: string | null;
  order_count: number; wishlist_count: number;
}

const panel = 'rounded-xl bg-white p-5';
const th = 'px-3 py-2 text-left text-xs uppercase tracking-wider text-stone-400';
const td = 'px-3 py-2.5 text-sm';
const btn = 'rounded-lg px-3 py-1.5 text-xs font-bold transition-colors';
const input = 'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#B08A57]';

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Request failed. Please try again.';
}

export default function Admin() {
  const { user, logout } = useAuth();
  const { refreshCatalog } = useShop();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');

  const quit = async () => { await logout(); nav('/admin/login'); };

  return (
    <div className="flex min-h-screen bg-[#EDE3D5]">
      <aside className="hidden w-60 shrink-0 bg-[#2A1912] p-5 text-stone-300 md:block" aria-label="Admin navigation">
        <p className="font-display text-xl font-semibold text-white">Home<span className="text-[#B98252]">Craft</span> <span className="text-xs font-normal">Admin</span></p>
        <p className="mt-1 truncate text-xs text-stone-500">{user?.email}</p>
        <nav className="mt-6 space-y-1">
          {TABS.map(({ id, label, icon: I }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${tab === id ? 'bg-white/10 font-semibold text-white' : 'hover:bg-white/5'}`}>
              <I size={17} /> {label}
            </button>
          ))}
          <a href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/5"><Eye size={17} /> View Store</a>
          <button onClick={quit} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-300 hover:bg-white/5"><LogOut size={17} /> Logout</button>
        </nav>
      </aside>
      <div className="min-w-0 flex-1 p-4 sm:p-8">
        <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${tab === id ? 'bg-[#2A1912] text-white' : 'bg-white'}`}>{label}</button>
          ))}
          <button onClick={quit} className="whitespace-nowrap rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-600">Logout</button>
        </div>

        {tab === 'dashboard' && <Dashboard />}
        {tab === 'users' && <UsersTab />}
        {tab === 'products' && <ProductsTab onChanged={refreshCatalog} />}
        {tab === 'collections' && <CollectionsTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'reviews' && <ReviewsTab />}
        {tab === 'messages' && <MessagesTab />}
      </div>
    </div>
  );
}

/* ---------------- dashboard ---------------- */

function Dashboard() {
  const [s, setS] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    adminApi<Record<string, unknown>>('/api/admin/stats')
      .then(setS).catch(e => setErr(errMsg(e)));
  }, []);
  if (err) return <p className={`${panel} text-sm text-red-600`}>{err}</p>;
  if (!s) return <p className="text-sm text-stone-500">Loading dashboard…</p>;
  const cards: [string, string][] = [
    ['Total Users', String(s.total_users)], ['Active Users', String(s.active_users)],
    ['Blocked Users', String(s.blocked_users)], ['Total Products', String(s.total_products)],
    ['Total Orders', String(s.total_orders)], ['Revenue', inr(Number(s.revenue))],
  ];
  return (
    <div>
      <h1 className="font-display text-3xl">Dashboard</h1>
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map(([t, v]) => (
          <div key={t} className={panel}><p className="text-xs uppercase tracking-wider text-stone-400">{t}</p><p className="font-display mt-1 text-2xl">{v}</p></div>
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className={panel}><h2 className="font-semibold">Recent Users</h2>
          {((s.recent_users ?? []) as AdminUser[]).map(u => (
            <p key={u.id} className="mt-2 flex justify-between text-sm"><span>{u.full_name} · {u.email}</span><StatusPill status={u.status} /></p>))}
        </div>
        <div className={panel}><h2 className="font-semibold">Recent Orders</h2>
          {((s.recent_orders ?? []) as { id: string; total: number; status: string }[]).map(o => (
            <p key={o.id} className="mt-2 flex justify-between text-sm"><span>{o.id} · {o.status}</span><b>{inr(o.total)}</b></p>))}
        </div>
        <div className={panel}><h2 className="font-semibold">Recently Added Products</h2>
          {((s.recent_products ?? []) as { id: string; name: string; price: number }[]).map(p => (
            <p key={p.id} className="mt-2 flex justify-between text-sm"><span>{p.name}</span><b>{inr(p.price)}</b></p>))}
        </div>
        <div className={panel}><h2 className="font-semibold">Low Stock Products</h2>
          {((s.low_stock ?? []) as { id: string; name: string; stock: number }[]).length === 0
            ? <p className="mt-2 text-sm text-stone-400">All stocked up.</p>
            : ((s.low_stock ?? []) as { id: string; name: string; stock: number }[]).map(p => (
              <p key={p.id} className="mt-2 flex justify-between text-sm"><span>{p.name}</span><b className="text-red-600">{p.stock} left</b></p>))}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const color = status === 'active' ? 'bg-green-100 text-green-800' : status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${color}`}>{status}</span>;
}

/* ---------------- users ---------------- */

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [detail, setDetail] = useState<(AdminUser & { orders: { id: string; total: number; status: string; created_at: string }[] }) | null>(null);

  const load = useCallback(async () => {
    try { setUsers(await adminApi<AdminUser[]>('/api/admin/users')); }
    catch (e) { setErr(errMsg(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (u: AdminUser, action: 'block' | 'unblock' | 'mute' | 'unmute' | 'delete') => {
    const labels = { block: `Block ${u.full_name}? They will no longer be able to log in.`, unblock: `Unblock ${u.full_name}?`, mute: `Mute ${u.full_name}? They will not be able to post reviews.`, unmute: `Unmute ${u.full_name}?`, delete: `Are you sure you want to delete ${u.full_name}? This permanently removes their account and data.` };
    if (!confirm(labels[action])) return;
    setBusy(`${action}-${u.id}`);
    try {
      if (action === 'delete') await adminApi(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      else await adminApi(`/api/admin/users/${u.id}/${action}`, { method: 'PATCH' });
      await load();
      setDetail(null);
    } catch (e) { alert(errMsg(e)); }
    finally { setBusy(''); }
  };

  const view = async (u: AdminUser) => {
    try { setDetail(await adminApi(`/api/admin/users/${u.id}`)); }
    catch (e) { alert(errMsg(e)); }
  };

  return (
    <div>
      <h1 className="font-display text-3xl">Users ({users.length})</h1>
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      <div className={`${panel} mt-5 overflow-x-auto p-2`}>
        <table className="w-full min-w-[760px] border-collapse">
          <thead><tr>{['Profile', 'Name', 'Email', 'Mobile', 'Gender', 'Created', 'Status', 'Actions'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-stone-100">
                <td className={td}>
                  {u.profile_image
                    ? <img src={u.profile_image.startsWith('/uploads/') ? `${API_BASE}${u.profile_image}` : u.profile_image} alt="" className="h-9 w-9 rounded-full object-cover" />
                    : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2A1912] text-xs font-bold text-[#D8B98A]">{u.full_name[0]}</span>}
                </td>
                <td className={td}><b>{u.full_name}</b>{u.role === 'admin' && <span className="ml-1 rounded bg-[#2A1912] px-1.5 py-0.5 text-[10px] font-bold text-white">ADMIN</span>}</td>
                <td className={td}>{u.email}</td>
                <td className={td}>{u.mobile}</td>
                <td className={`${td} capitalize`}>{u.gender.replace(/_/g, ' ')}</td>
                <td className={td}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                <td className={td}><StatusPill status={u.status} /></td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => view(u)} className={`${btn} border border-stone-200`}>View</button>
                    {u.role !== 'admin' && (
                      <>
                        {u.status === 'blocked'
                          ? <button disabled={busy !== ''} onClick={() => act(u, 'unblock')} className={`${btn} bg-green-100 text-green-800`}>Unblock</button>
                          : <button disabled={busy !== ''} onClick={() => act(u, 'block')} className={`${btn} bg-red-100 text-red-700`}>Block</button>}
                        {u.status === 'muted'
                          ? <button disabled={busy !== ''} onClick={() => act(u, 'unmute')} className={`${btn} bg-green-100 text-green-800`}>Unmute</button>
                          : <button disabled={busy !== ''} onClick={() => act(u, 'mute')} className={`${btn} bg-amber-100 text-amber-800`}>Mute</button>}
                        <button disabled={busy !== ''} onClick={() => act(u, 'delete')} className={`${btn} border border-red-200 text-red-600`}>Delete</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2A1912]/60 p-4" onClick={() => setDetail(null)}>
          <div className={`${panel} max-h-[85vh] w-full max-w-lg overflow-y-auto`} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="User details">
            <div className="flex items-center gap-4">
              {detail.profile_image
                ? <img src={detail.profile_image.startsWith('/uploads/') ? `${API_BASE}${detail.profile_image}` : detail.profile_image} alt="" className="h-16 w-16 rounded-full object-cover" />
                : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2A1912] font-display text-2xl text-[#D8B98A]">{detail.full_name[0]}</span>}
              <div><h2 className="font-display text-xl">{detail.full_name}</h2><StatusPill status={detail.status} /></div>
              <button onClick={() => setDetail(null)} className="ml-auto rounded-lg border px-3 py-1.5 text-sm">Close</button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[['Email', detail.email], ['Mobile', detail.mobile], ['Gender', detail.gender.replace(/_/g, ' ')],
                ['Created', new Date(detail.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                ['Last login', detail.last_login ? new Date(detail.last_login).toLocaleString('en-IN') : 'Never'],
                ['Orders / Wishlist', `${detail.order_count} / ${detail.wishlist_count}`]].map(([t, v]) => (
                <div key={t} className="rounded-lg bg-[#F5EFE6] p-3"><dt className="text-xs text-stone-400">{t}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>
              ))}
            </dl>
            <h3 className="mt-4 font-semibold">Orders</h3>
            {detail.orders.length === 0 ? <p className="mt-1 text-sm text-stone-400">No orders.</p> :
              detail.orders.map(o => <p key={o.id} className="mt-1.5 flex justify-between text-sm"><span>{o.id} · {o.status}</span><b>{inr(o.total)}</b></p>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- products ---------------- */

type AdminVariant = { colorName: string; colorValue: string; price: string; stock: string; rotationImages: string[] };
const emptyForm = {
  name: '', description: '', price: '', old_price: '', stock: '10', category: 'Living Room',
  collections: [] as string[], tags: '', colors: '', sizes: '', rating: '4.5',
  featured: false, new_arrival: false, images: [] as string[], rotationImages: [] as string[],
  variants: [] as AdminVariant[],
};

function ProductsTab({ onChanged }: { onChanged: () => Promise<void> }) {
  const [server, setServer] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [stock, setStockFilter] = useState('All');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState<Product | null>(null);

  const load = useCallback(async () => {
    try { setServer(await adminApi<Product[]>('/api/products')); }
    catch { /* public catalogue fallback below */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const all = [...server, ...PRODUCTS.filter(p => !server.some(s => s.id === p.id))];
  const filtered = all.filter(p =>
    (cat === 'All' || p.category === cat) &&
    (stock === 'All' || (stock === 'Low' ? p.stock < 10 : stock === 'Out' ? p.stock === 0 : p.stock > 0)) &&
    (q === '' || p.name.toLowerCase().includes(q.toLowerCase())));

  const pickFiles = (files: FileList | null, key: 'images' | 'rotationImages' = 'images') => {
    if (!files) return;
    const limit = key === 'rotationImages' ? 8 : 6;
    const valid = ['image/jpeg', 'image/png', 'image/webp'];
    const jobs: Promise<string>[] = [];
    for (const f of Array.from(files).slice(0, limit)) {
      if (!valid.includes(f.type)) { setMsg(`Skipped ${f.name}: only JPG, PNG or WebP allowed.`); continue; }
      if (f.size > 3 * 1024 * 1024) { setMsg(`Skipped ${f.name}: must be under 3 MB.`); continue; }
      jobs.push(new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(new Error('read failed'));
        r.readAsDataURL(f);
      }));
    }
    Promise.all(jobs).then(urls => setForm(f => ({ ...f, [key]: [...(f[key] as string[]), ...urls].slice(0, limit) })));
  };
  const moveRotation = (from: number, dir: -1 | 1) => {
    setForm(f => {
      const arr = [...f.rotationImages];
      const to = from + dir;
      if (to < 0 || to >= arr.length) return f;
      [arr[from], arr[to]] = [arr[to], arr[from]];
      return { ...f, rotationImages: arr };
    });
  };

  const startAdd = () => { setForm(emptyForm); setEditing(null); setShowForm(true); setMsg(''); window.scrollTo({ top: 0 }); };
  const startEdit = (p: Product) => {
    if (server.every(s => s.id !== p.id)) { setMsg('Static demo products cannot be edited — add a new product instead.'); return; }
    const pVars = (p as unknown as { variants?: { colorName: string; colorValue: string; price?: number; stock?: number; rotationImages?: string[] }[] }).variants;
    setForm({
      name: p.name, description: p.description, price: String(p.price), old_price: p.oldPrice ? String(p.oldPrice) : '',
      stock: String(p.stock), category: p.category, collections: p.collections ?? [], tags: (p.tags ?? []).join(', '),
      colors: p.colors.join(', '), sizes: p.sizes.join(', '), rating: String(p.rating),
      featured: !!p.featured, new_arrival: !!p.newArrival, images: p.images, rotationImages: (p as unknown as { rotationImages?: string[] }).rotationImages ?? [],
      variants: pVars ? pVars.map(v => ({ colorName: v.colorName, colorValue: v.colorValue, price: v.price ? String(v.price) : '', stock: v.stock ? String(v.stock) : '', rotationImages: v.rotationImages ?? [] })) : [],
    });
    setEditing(p.id); setShowForm(true); setMsg(''); window.scrollTo({ top: 0 });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (form.name.trim().length < 2) return setMsg('Enter a product name.');
    if (!(Number(form.price) > 0)) return setMsg('Enter a valid price.');
    if (form.images.length === 0) return setMsg('Add at least one product image.');
    setBusy(true); setMsg(''); setErr('');
    const payload: Record<string, unknown> = {
      name: form.name.trim(), description: form.description.trim(), price: Number(form.price),
      old_price: form.old_price ? Number(form.old_price) : null, stock: Number(form.stock) || 0,
      category: form.category, collections: form.collections.length ? form.collections : [CAT_NAMES.includes(form.category) ? slugify(form.category) : 'living-room'],
      tags: form.tags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
      colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
      rating: Number(form.rating) || 4.5, featured: form.featured, new_arrival: form.new_arrival, images: form.images,
      rotation_images: form.rotationImages,
      variants: form.variants.map(v => ({ colorName: v.colorName.trim(), colorValue: v.colorValue.trim(), price: v.price ? Number(v.price) : undefined, stock: v.stock ? Number(v.stock) : undefined, rotationImages: v.rotationImages })),
    };
    try {
      if (editing) {
        await adminApi(`/api/admin/products/${editing}`, { method: 'PUT', body: JSON.stringify(payload) });
        setMsg('Product updated successfully.');
      } else {
        await adminApi('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) });
        setMsg('Product added successfully.');
      }
      await load();
      await onChanged(); // push into the public shop catalogue immediately
      setShowForm(false); setEditing(null); setForm(emptyForm);
    } catch (e2) { setErr(errMsg(e2)); }
    finally { setBusy(false); }
  };

  const del = (p: Product) => {
    if (busy) return;
    setMsg(''); setErr('');
    setPending(p);
  };

  const confirmDelete = async () => {
    const p = pending;
    if (!p || busy) return;
    setBusy(true); setErr('');
    try {
      // DB-backed products are deleted as rows; catalogue products are recorded
      // as removed so the static entry does not return after a refresh.
      const isRow = server.some(s => s.id === p.id);
      await adminApi(`/api/admin/products/${encodeURIComponent(p.id)}${isRow ? '' : '?catalogue=true'}`, { method: 'DELETE' });
      setPending(null);
      await onChanged(); // refresh the shared catalogue (drops the deleted product)
      await load();      // then re-render the admin list
      setMsg(`"${p.name}" was deleted and is no longer in the shop.`);
    } catch (e) { setErr(errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl">Products ({filtered.length})</h1>
        <button onClick={startAdd} className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#2A1912] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#8B5E3C]"><Plus size={16} /> Add Product</button>
      </div>
      {msg && <p role="status" className="mt-3 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">{msg}</p>}
      {err && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}

      {showForm && (
        <form onSubmit={save} className={`${panel} mt-4 grid gap-4 md:grid-cols-2`} noValidate>
          <h2 className="font-display text-xl md:col-span-2">{editing ? 'Edit Product' : 'Add Product'}</h2>
          <div><label className="text-sm font-semibold" htmlFor="pf-name">Product Name</label>
            <input id="pf-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`${input} mt-1`} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-semibold" htmlFor="pf-cat">Category</label>
              <select id="pf-cat" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={`${input} mt-1`}>
                {CAT_NAMES.map(c => <option key={c}>{c}</option>)}
              </select></div>
            <div><label className="text-sm font-semibold" htmlFor="pf-rating">Rating</label>
              <input id="pf-rating" type="number" min="1" max="5" step="0.1" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} className={`${input} mt-1`} /></div>
          </div>
          <div className="md:col-span-2"><label className="text-sm font-semibold" htmlFor="pf-desc">Description</label>
            <textarea id="pf-desc" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${input} mt-1`} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-semibold" htmlFor="pf-price">Price (₹)</label>
              <input id="pf-price" type="number" min="1" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={`${input} mt-1`} /></div>
            <div><label className="text-sm font-semibold" htmlFor="pf-old">Old Price (₹)</label>
              <input id="pf-old" type="number" min="0" value={form.old_price} onChange={e => setForm({ ...form, old_price: e.target.value })} className={`${input} mt-1`} /></div>
            <div><label className="text-sm font-semibold" htmlFor="pf-stock">Stock</label>
              <input id="pf-stock" type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className={`${input} mt-1`} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-semibold" htmlFor="pf-colors">Colors (comma separated)</label>
              <input id="pf-colors" value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })} placeholder="Walnut, Oak" className={`${input} mt-1`} /></div>
            <div><label className="text-sm font-semibold" htmlFor="pf-sizes">Sizes (comma separated)</label>
              <input id="pf-sizes" value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })} placeholder="2-Seater, 3-Seater" className={`${input} mt-1`} /></div>
          </div>
          <fieldset className="md:col-span-2">
            <legend className="text-sm font-semibold">Collections (product appears in each selected collection + Shop)</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLLECTIONS.map(c => (
                <button type="button" key={c.slug} aria-pressed={form.collections.includes(c.slug)}
                  onClick={() => setForm(f => ({ ...f, collections: f.collections.includes(c.slug) ? f.collections.filter(x => x !== c.slug) : [...f.collections, c.slug] }))}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${form.collections.includes(c.slug) ? 'border-[#2A1912] bg-[#2A1912] text-white' : 'border-stone-200'}`}>
                  {c.name}</button>
              ))}
            </div>
          </fieldset>
          <div className="md:col-span-2">
            <span className="text-sm font-semibold">Product Images (JPG/PNG/WebP, ≤3 MB each)</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.images.map((u, i) => (
                <span key={i} className="relative">
                  <img src={u} alt={`Preview ${i + 1}`} className="h-20 w-20 rounded-lg border object-cover" />
                  <button type="button" aria-label={`Remove image ${i + 1}`} onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                    className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">×</button>
                </span>
              ))}
              {form.images.length < 6 && (
                <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-lg border border-dashed border-stone-300 text-xs font-semibold text-stone-400">
                  + Upload
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e => { pickFiles(e.target.files, 'images'); e.target.value = ''; }} />
                </label>
              )}
            </div>
          </div>
          <div className="md:col-span-2 rounded-xl border border-[#DCCBB8]/50 bg-[#FFF9F0] p-3">
            <span className="text-sm font-semibold">Product Rotation Images <span className="font-normal text-stone-400">(optional, order = 1. Front → Front Right → … → Front Left)</span></span>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.rotationImages.map((u, i) => (
                <span key={i} className="relative">
                  <img src={u} alt={`Rotation ${i + 1}`} className="h-20 w-20 rounded-lg border object-cover" />
                  <span className="absolute -left-1 -top-1 rounded-full bg-[#2A1912] px-1.5 py-0.5 text-[10px] font-bold text-white">{i+1}</span>
                  <button type="button" aria-label={`Remove rotation image ${i + 1}`} onClick={() => setForm(f => ({ ...f, rotationImages: f.rotationImages.filter((_, j) => j !== i) }))}
                    className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">×</button>
                  <span className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-1">
                    <button type="button" onClick={() => moveRotation(i, -1)} disabled={i===0} className="rounded bg-white/90 px-1 text-xs disabled:opacity-30">‹</button>
                    <button type="button" onClick={() => moveRotation(i, 1)} disabled={i===form.rotationImages.length-1} className="rounded bg-white/90 px-1 text-xs disabled:opacity-30">›</button>
                  </span>
                </span>
              ))}
              {form.rotationImages.length < 8 && (
                <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-lg border border-dashed border-stone-300 text-xs font-semibold text-stone-400">
                  + Upload
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e => { pickFiles(e.target.files, 'rotationImages'); e.target.value = ''; }} />
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-stone-500">Drag left/right on the product page cycles these frames. Leave empty to use normal gallery. Each variant reuses these frames unless you upload per-variant rotation via the same order.</p>
          </div>
          <div className="md:col-span-2 rounded-xl border border-[#DCCBB8]/50 bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Color Variants — per-color rotation</span>
              <button type="button" onClick={() => setForm(f => ({ ...f, variants: [...f.variants, { colorName: '', colorValue: '#8B5E3C', price: '', stock: '', rotationImages: [] }] }))}
                className="rounded-lg bg-[#2A1912] px-3 py-1.5 text-xs font-bold text-white">+ Add Color Variant</button>
            </div>
            {form.variants.length === 0 && <p className="mt-2 text-xs text-stone-500">No per-color variants — the product will use Colors above. Add variants for true per-color rotation (Mahogany / Black / Beige each with its own frames).</p>}
            {form.variants.map((v, vi) => (
              <div key={vi} className="mt-3 rounded-lg border border-stone-200 p-3">
                <div className="grid gap-2 sm:grid-cols-4">
                  <div><label className="text-xs font-semibold">Color Name</label><input value={v.colorName} onChange={e => setForm(f => { const a=[...f.variants]; a[vi]={...a[vi], colorName:e.target.value}; return {...f, variants:a}; })} placeholder="Mahogany" className={`${input} mt-1`} /></div>
                  <div><label className="text-xs font-semibold">Color Value</label><div className="mt-1 flex gap-1"><input type="color" value={/^#[0-9a-fA-F]{6}$/.test(v.colorValue) ? v.colorValue : '#8B5E3C'} onChange={e => setForm(f => { const a=[...f.variants]; a[vi]={...a[vi], colorValue:e.target.value}; return {...f, variants:a}; })} className="h-9 w-9 rounded border" /><input value={v.colorValue} onChange={e => setForm(f => { const a=[...f.variants]; a[vi]={...a[vi], colorValue:e.target.value}; return {...f, variants:a}; })} placeholder="#7A4A24" className={`${input} flex-1`} /></div></div>
                  <div><label className="text-xs font-semibold">Variant Price (optional)</label><input value={v.price} onChange={e => setForm(f => { const a=[...f.variants]; a[vi]={...a[vi], price:e.target.value}; return {...f, variants:a}; })} placeholder="use base" className={`${input} mt-1`} /></div>
                  <div><label className="text-xs font-semibold">Variant Stock</label><input value={v.stock} onChange={e => setForm(f => { const a=[...f.variants]; a[vi]={...a[vi], stock:e.target.value}; return {...f, variants:a}; })} placeholder="10" className={`${input} mt-1`} /></div>
                </div>
                <div className="mt-2"><span className="text-xs font-semibold">Rotation Images for {v.colorName || `Variant ${vi+1}`} (1=Front → 8=Front Left)</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {v.rotationImages.map((u, ri) => (
                      <span key={ri} className="relative">
                        <img src={u} alt="" className="h-16 w-16 rounded-lg border object-cover" />
                        <span className="absolute -left-1 -top-1 rounded-full bg-[#2A1912] px-1 py-0.5 text-[9px] text-white">{ri+1}</span>
                        <button type="button" onClick={() => setForm(f => { const a=[...f.variants]; a[vi]={...a[vi], rotationImages:a[vi].rotationImages.filter((_,j)=>j!==ri)}; return {...f, variants:a}; })} className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1 text-xs text-white">×</button>
                      </span>
                    ))}
                    {v.rotationImages.length < 8 && <label className="grid h-16 w-16 cursor-pointer place-items-center rounded-lg border border-dashed text-xs">+ Upload<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e => { const files=e.target.files; if(!files) return; const valid=['image/jpeg','image/png','image/webp']; const jobs:Promise<string>[]=[]; for(const f of Array.from(files).slice(0,8-v.rotationImages.length)){ if(!valid.includes(f.type)) continue; if(f.size>3*1024*1024) continue; jobs.push(new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result as string); r.readAsDataURL(f); })); } Promise.all(jobs).then(urls=> setForm(ff=>{ const a=[...ff.variants]; a[vi]={...a[vi], rotationImages:[...a[vi].rotationImages, ...urls].slice(0,8)}; return {...ff, variants:a}; })); e.target.value=''; }} /></label>}
                  </div>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_,i)=>i!==vi)}))} className="mt-2 text-xs font-bold text-red-600">Remove variant</button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 md:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 accent-[#B08A57]" /> Featured</label>
            <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={form.new_arrival} onChange={e => setForm({ ...form, new_arrival: e.target.checked })} className="h-4 w-4 accent-[#B08A57]" /> New Arrival</label>
          </div>
          <div className="flex gap-2 md:col-span-2">
            <button disabled={busy} className="rounded-lg bg-[#2A1912] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {busy ? (editing ? 'Saving changes…' : 'Adding product…') : (editing ? 'Save Changes' : 'Add Product')}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-stone-200 px-6 py-2.5 text-sm font-semibold">Cancel</button>
          </div>
        </form>
      )}

      <div className={`${panel} mt-4 flex flex-wrap gap-3`}>
        <div className="relative min-w-52 flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by product name…" aria-label="Search products" className={`${input} pl-9`} />
        </div>
        <select value={cat} onChange={e => setCat(e.target.value)} aria-label="Filter by category" className="rounded-lg border border-stone-200 px-3 py-2 text-sm">
          <option>All</option>{CAT_NAMES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={stock} onChange={e => setStockFilter(e.target.value)} aria-label="Filter by stock" className="rounded-lg border border-stone-200 px-3 py-2 text-sm">
          {['All', 'In stock', 'Low', 'Out'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="mt-4 space-y-2.5">
        {filtered.map(p => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 text-sm">
            <img src={p.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <b>{p.name}</b>
              <p className="text-xs text-stone-400">{p.category} · {(p.collections ?? []).join(', ')}</p>
            </div>
            <span>{inr(p.price)} · {p.stock} in stock</span>
            <a href={`/product/${p.id}`} target="_blank" rel="noreferrer" className={`${btn} border border-stone-200`}>View</a>
            <button onClick={() => startEdit(p)} className={`${btn} border border-stone-200`}>Edit</button>
            <button onClick={() => del(p)} className={`${btn} border border-red-200 text-red-600`}><Trash2 size={13} className="inline" /> Delete</button>
          </div>
        ))}
        {filtered.length === 0 && <p className={`${panel} text-center text-sm text-stone-400`}>No products match.</p>}
      </div>

      {pending && (
        <div className="overlay-in fixed inset-0 z-50 grid place-items-center bg-[#2A1912]/55 p-4" role="dialog" aria-modal="true" aria-labelledby="del-title" onClick={() => !busy && setPending(null)}>
          <div className="modal-in w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 id="del-title" className="font-display text-xl">Delete this product?</h2>
            <p className="mt-2 text-sm text-stone-600">
              <b>{pending.name}</b> will be removed from the shop, categories, collections and search.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button onClick={() => setPending(null)} disabled={busy} className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-stone-100 disabled:opacity-60">Cancel</button>
              <button onClick={confirmDelete} disabled={busy} className="btn-lux rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* ---------------- collections ---------------- */

function CollectionsTab() {
  const [cols, setCols] = useState<{ slug: string; name: string; description: string }[]>([]);
  const load = useCallback(async () => {
    try { setCols(await adminApi('/api/collections')); } catch { /* ignore */ }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <h1 className="font-display text-3xl">Collections</h1>
      <p className="mt-1 text-sm text-stone-500">Products link to collections by slug — assign them in the product form above.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {COLLECTIONS.map(c => {
          const live = cols.find(x => x.slug === c.slug);
          const count = PRODUCTS.filter(p => (p.collections ?? []).includes(c.slug)).length;
          return (
            <div key={c.slug} className={panel}>
              <div className="flex items-center gap-3">
                <img src={c.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <div><h2 className="font-semibold">{live?.name ?? c.name}</h2>
                  <p className="text-xs text-stone-400">{count} products · /shop?category={c.slug}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- orders ---------------- */

function OrdersTab() {
  const [orders, setOrders] = useState<{ id: string; total: number; status: string; name: string; city: string; customer?: string; created_at: string; items: { name: string; qty: number; price: number }[] }[]>([]);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try { setOrders(await adminApi('/api/admin/orders')); }
    catch (e) { setErr(errMsg(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    try {
      await adminApi(`/api/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setOrders(os => os.map(o => (o.id === id ? { ...o, status } : o)));
    } catch (e) { alert(errMsg(e)); }
  };

  return (
    <div>
      <h1 className="font-display text-3xl">Orders ({orders.length})</h1>
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      <div className="mt-5 space-y-3">
        {orders.length === 0 && !err && <p className={`${panel} text-center text-sm text-stone-400`}>No orders yet.</p>}
        {orders.map(o => (
          <div key={o.id} className={`${panel} text-sm`}>
            <div className="flex flex-wrap gap-3"><b>{o.id}</b><span>{o.customer ?? o.name} · {o.city}</span>
              <span className="text-stone-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</span>
              <b className="ml-auto">{inr(o.total)}</b></div>
            <p className="mt-1 text-xs text-stone-400">{o.items.map(i => `${i.name} × ${i.qty}`).join(' · ')}</p>
            <div className="mt-3 flex items-center gap-2">
              <label htmlFor={`st-${o.id}`} className="text-xs text-stone-400">Status</label>
              <select id={`st-${o.id}`} value={o.status} onChange={e => setStatus(o.id, e.target.value)} className="rounded border px-2 py-1.5">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- reviews ---------------- */

function ReviewsTab() {
  const [reviews, setReviews] = useState<{ id: number; user_name: string; product_name: string; rating: number; text: string; status: string; created_at: string }[]>([]);
  const load = useCallback(async () => {
    try { setReviews(await adminApi('/api/admin/reviews')); } catch { /* ignore */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const approve = async (id: number) => {
    await adminApi(`/api/admin/reviews/${id}/approve`, { method: 'PATCH' });
    load();
  };
  const remove = async (id: number) => {
    if (!confirm('Remove this review?')) return;
    await adminApi(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 className="font-display text-3xl">Reviews ({reviews.length})</h1>
      <div className="mt-5 space-y-3">
        {reviews.length === 0 && <p className={`${panel} text-center text-sm text-stone-400`}>No customer reviews yet. Muted/blocked users are prevented from posting.</p>}
        {reviews.map(r => (
          <div key={r.id} className={`${panel} text-sm`}>
            <div className="flex flex-wrap gap-2"><b>{r.user_name}</b><span className="text-stone-400">on {r.product_name || 'a product'}</span>
              <span className="ml-auto">{'★'.repeat(r.rating)}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{r.status}</span></div>
            <p className="mt-1.5 text-stone-600">{r.text}</p>
            <div className="mt-2.5 flex gap-2">
              {r.status !== 'approved' && <button onClick={() => approve(r.id)} className={`${btn} bg-green-100 text-green-800`}>Approve</button>}
              <button onClick={() => remove(r.id)} className={`${btn} border border-red-200 text-red-600`}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- messages ---------------- */

function MessagesTab() {
  const [msgs, setMsgs] = useState<{ id: number; name: string; email: string; subject: string; message: string; created_at: string; is_read: number }[]>([]);
  const load = useCallback(async () => {
    try { setMsgs(await adminApi('/api/admin/messages')); } catch { /* ignore */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const read = async (id: number) => {
    await adminApi(`/api/admin/messages/${id}/read`, { method: 'PATCH' });
    load();
  };
  const del = async (id: number) => {
    if (!confirm('Delete this message?')) return;
    await adminApi(`/api/admin/messages/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 className="font-display text-3xl">Messages ({msgs.length})</h1>
      <div className="mt-5 space-y-3">
        {msgs.length === 0 && <p className={`${panel} text-center text-sm text-stone-400`}>No contact messages.</p>}
        {msgs.map(m => (
          <div key={m.id} className={`${panel} text-sm ${m.is_read ? '' : 'border-l-4 border-l-[#B08A57]'}`}>
            <div className="flex flex-wrap gap-2"><b>{m.name}</b><span className="text-stone-400">{m.email}</span>
              <span className="ml-auto text-xs text-stone-400">{new Date(m.created_at).toLocaleDateString('en-IN')}</span></div>
            {m.subject && <p className="mt-1 font-semibold">{m.subject}</p>}
            <p className="mt-1 text-stone-600">{m.message}</p>
            <div className="mt-2.5 flex gap-2">
              {!m.is_read && <button onClick={() => read(m.id)} className={`${btn} flex items-center gap-1 border border-stone-200`}><Mail size={13} /> Mark as Read</button>}
              <button onClick={() => del(m.id)} className={`${btn} border border-red-200 text-red-600`}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
