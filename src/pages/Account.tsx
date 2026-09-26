import { Camera, Check, Heart, Home, LogOut, MapPin, Package, Settings, Trash2, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickView from '../components/QuickView';
import SearchOverlay from '../components/SearchOverlay';
import { PRODUCTS, inr } from '../lib/data';
import { firstName, profileCompletion, useAuth, type Address } from '../lib/auth';
import { useShop } from '../lib/store';

type Tab = 'overview' | 'profile' | 'orders' | 'wishlist' | 'addresses' | 'settings';
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  { id: 'settings', label: 'Account Settings', icon: Settings },
];

const card = 'rounded-2xl border border-[#DCCBB8]/60 bg-[#FFF9F0] p-6';
const btnPrimary = 'btn-lux btn-primary rounded-lg px-6 py-2.5 text-sm font-bold';
const fieldCls = 'mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#B08A57]';

export function Account() {
  const { user, logout, addresses, serverOrders, refreshOrders } = useAuth();
  const { wishlist, moveToCart } = useShop();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => { refreshOrders(); }, [refreshOrders]);
  if (!user) return null; // ProtectedRoute guards; avoids render-during-nav

  const saved = PRODUCTS.filter(p => wishlist.includes(p.id));
  const { pct, missing } = profileCompletion(user, addresses.length);
  const recent = serverOrders.slice(0, 3);

  const go = (t: Tab) => { setTab(t); setMobileNav(false); };

  return (
    <div><Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl sm:text-4xl">Welcome back, {firstName(user)}</h1>
        <p className="mt-1 text-sm text-stone-500">{user.email} · Member since {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>

        <button onClick={() => setMobileNav(v => !v)} className="mt-5 w-full rounded-lg border border-[#DCCBB8] bg-white py-3 text-sm font-bold sm:hidden" aria-expanded={mobileNav}>
          {TABS.find(t => t.id === tab)?.label} — switch section ▾
        </button>

        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className={`${mobileNav ? 'block' : 'hidden'} h-fit rounded-2xl border border-[#DCCBB8]/60 bg-white p-3 sm:block lg:sticky lg:top-24`} aria-label="Account navigation">
            {TABS.map(({ id, label, icon: I }) => (
              <button key={id} onClick={() => go(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${tab === id ? 'bg-[#2A1912] font-semibold text-white' : 'hover:bg-[#EDE3D5]'}`}>
                <I size={17} /> {label}
              </button>
            ))}
            <button onClick={() => { logout(); nav('/'); }} className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">
              <LogOut size={17} /> Logout
            </button>
          </aside>

          <div className="min-w-0">
            {tab === 'overview' && <Overview pct={pct} missing={missing} recent={recent} addressCount={addresses.length} go={go} />}
            {tab === 'profile' && <Profile />}
            {tab === 'orders' && <Orders />}
            {tab === 'wishlist' && (
              <div>
                <h2 className="font-display text-2xl">Wishlist ({saved.length})</h2>
                {saved.length === 0 ? <p className={`${card} mt-4 text-sm text-stone-500`}>Nothing saved yet — tap the heart on any product.</p> : (
                  <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {saved.map(p => (
                      <div key={p.id}>
                        <ProductCard p={p} />
                        <button onClick={() => moveToCart(p.id)} className="mt-2 w-full rounded-lg bg-[#2A1912] py-2 text-xs font-bold text-white hover:bg-[#8B5E3C]">Move to Cart</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === 'addresses' && <Addresses />}
            {tab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div><Footer /><QuickView /><SearchOverlay /></div>
  );
}

function Overview({ pct, missing, recent, addressCount, go }: { pct: number; missing: string[]; recent: ReturnType<typeof useAuth>['serverOrders']; addressCount: number; go: (t: Tab) => void }) {
  const { orders } = useShop();
  const { wishlist } = useShop();
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ['Orders', String(orders.length), 'Track every purchase'],
          ['Wishlist Items', String(wishlist.length), 'Saved for later'],
          ['Saved Addresses', String(addressCount), 'Fast checkout'],
        ].map(([t, v, d]) => (
          <div key={t} className={card}><p className="text-xs uppercase tracking-wider text-stone-400">{t}</p>
            <p className="font-display mt-1 text-3xl">{v}</p><p className="mt-1 text-xs text-stone-400">{d}</p></div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <div className="flex items-center justify-between"><h3 className="font-semibold">Profile Completion</h3><b className="text-[#8B5E3C]">{pct}%</b></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-gradient-to-r from-[#8B5E3C] to-[#B98252] transition-all" style={{ width: `${pct}%` }} />
          </div>
          {missing.length > 0 ? (
            <><p className="mt-3 text-xs text-stone-500">Missing: {missing.join(' · ')}</p>
              <button onClick={() => go('profile')} className="mt-3 rounded-lg border border-[#2A1912] px-4 py-2 text-xs font-bold hover:bg-[#2A1912] hover:text-white">Complete Profile</button></>
          ) : <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-green-700"><Check size={15} /> Profile complete — nice!</p>}
        </div>
        <div className={card}>
          <div className="flex items-center justify-between"><h3 className="font-semibold">Recent Orders</h3>
            <button onClick={() => go('orders')} className="text-xs font-bold text-[#8B5E3C] hover:underline">View all</button></div>
          {recent.length === 0 && orders.length === 0
            ? <p className="mt-3 text-sm text-stone-400">No orders yet. Your history will appear here.</p>
            : recent.map(o => <p key={o.id} className="mt-2.5 flex justify-between text-sm"><span>{o.id} · {o.status}</span><b>{inr(o.total)}</b></p>)}
        </div>
      </div>
    </div>
  );
}

function Profile() {
  const { user, updateProfile, uploadAvatar, removeAvatar } = useAuth();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ full_name: user!.full_name, mobile: user!.mobile, gender: user!.gender });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setMsg(null); setBusy(true);
    try {
      await updateProfile(f);
      setMsg({ ok: true, text: 'Profile updated successfully.' });
      setEdit(false);
    } catch (e2) { setMsg({ ok: false, text: e2 instanceof Error ? e2.message : 'Please correct the highlighted fields.' }); }
    finally { setBusy(false); }
  };

  const pick = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    try { await uploadAvatar(file); setMsg({ ok: true, text: 'Profile updated successfully.' }); }
    catch (e2) { setMsg({ ok: false, text: e2 instanceof Error ? e2.message : 'Image upload failed.' }); setPreview(null); }
  };

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          {preview || user!.profile_image
            ? <img src={preview ?? user!.profile_image!} alt="Profile" className="h-24 w-24 rounded-full border-2 border-[#B08A57] object-cover" />
            : <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#2A1912] font-display text-3xl text-[#D8B98A]">{user!.full_name[0]}</span>}
          <button onClick={() => fileRef.current?.click()} aria-label="Upload profile image"
            className="absolute -bottom-1 -right-1 rounded-full bg-[#B08A57] p-2 text-white shadow hover:bg-[#2A1912]"><Camera size={15} /></button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} />
        </div>
        <div>
          <h2 className="font-display text-2xl">{user!.full_name}</h2>
          <p className="text-sm text-stone-500">{user!.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button onClick={() => fileRef.current?.click()} className="text-xs font-bold text-[#8B5E3C] hover:underline">{user!.profile_image ? 'Change Image' : 'Upload Image'}</button>
            {user!.profile_image && <button onClick={() => removeAvatar()} className="text-xs font-semibold text-stone-400 hover:text-red-600">Remove</button>}
            <span className="text-xs text-stone-400">JPG, PNG or WebP · up to 5 MB</span>
          </div>
        </div>
      </div>

      {!edit ? (
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          {[['Full Name', user!.full_name], ['Email (read-only)', user!.email], ['Mobile Number', user!.mobile], ['Gender', user!.gender.replace(/_/g, ' ')],
            ['Account created', new Date(user!.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })]].map(([t, v]) => (
            <div key={t} className="rounded-xl bg-white p-4"><dt className="text-xs uppercase tracking-wider text-stone-400">{t}</dt><dd className="mt-1 font-semibold capitalize">{v}</dd></div>
          ))}
          <div className="sm:col-span-2"><button onClick={() => { setEdit(true); setF({ full_name: user!.full_name, mobile: user!.mobile, gender: user!.gender }); }} className={btnPrimary}>Edit Profile</button></div>
        </dl>
      ) : (
        <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
          <div><label htmlFor="pf-name" className="text-sm font-semibold">Full Name</label>
            <input id="pf-name" value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} className={fieldCls} /></div>
          <div><label htmlFor="pf-mobile" className="text-sm font-semibold">Mobile Number</label>
            <input id="pf-mobile" value={f.mobile} onChange={e => setF({ ...f, mobile: e.target.value })} className={fieldCls} /></div>
          <div>
            <span className="text-sm font-semibold">Gender</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {[['male', 'Male'], ['female', 'Female'], ['other', 'Other'], ['prefer_not_to_say', 'Prefer not to say']].map(([v, l]) => (
                <button type="button" key={v} onClick={() => setF({ ...f, gender: v })} aria-pressed={f.gender === v}
                  className={`rounded-full border px-4 py-1.5 text-sm ${f.gender === v ? 'border-[#2A1912] bg-[#2A1912] font-semibold text-white' : 'border-stone-200'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>{busy ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" onClick={() => setEdit(false)} className="rounded-lg border border-stone-200 px-6 py-2.5 text-sm font-semibold">Cancel</button>
          </div>
        </form>
      )}
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mt-4 rounded-lg p-3 text-sm ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.ok ? '✓ ' : ''}{msg.text}</p>}
    </div>
  );
}

function Orders() {
  const { serverOrders } = useAuth();
  const { orders } = useShop();
  const [open, setOpen] = useState<string | null>(null);

  const serverRows = serverOrders.map(o => ({
    id: o.id, date: o.created_at, total: o.total, status: o.status,
    lines: o.items.map(i => ({ name: i.name || i.product_id, qty: i.qty, price: i.price })),
  }));
  const localRows = orders.map(o => ({
    id: o.id, date: o.date, total: o.total, status: o.status,
    lines: o.items.map(i => {
      const p = PRODUCTS.find(p => p.id === i.productId);
      return { name: p?.name ?? i.productId, qty: i.qty, price: p?.price ?? 0 };
    }),
  }));
  const all = [...serverRows, ...localRows];

  if (all.length === 0) return <p className={`${card} text-sm text-stone-500`}>No orders yet. Your history will appear here.</p>;
  return (
    <div className="space-y-3">
      {all.map(o => (
        <div key={o.id} className={card}>
          <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full flex-wrap items-center gap-3 text-left text-sm" aria-expanded={open === o.id}>
            <b>{o.id}</b>
            <span className="text-stone-400">{new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <b className="ml-auto">{inr(o.total)}</b>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">{o.status}</span>
          </button>
          {open === o.id && (
            <div className="mt-3 border-t pt-3 text-sm">
              {o.lines.map((l, i) => (
                <p key={i} className="flex justify-between py-1 text-stone-500"><span>{l.name} × {l.qty}</span><span>{inr(l.price * l.qty)}</span></p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const emptyAddr: Omit<Address, 'id'> = { full_name: '', mobile: '', address: '', city: '', state: 'Tamil Nadu', pincode: '', is_default: 0 };

function Addresses() {
  const { addresses, saveAddress, deleteAddress } = useAuth();
  const [form, setForm] = useState<(Omit<Address, 'id'> & { id?: number }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || busy) return;
    if (form.full_name.trim().length < 2) return setErr('Enter the recipient name.');
    if (!/^[6-9]\d{9}$/.test(form.mobile.replace(/\s/g, ''))) return setErr('Please enter a valid 10-digit Indian mobile number.');
    if (form.address.trim().length < 6) return setErr('Enter the full street address.');
    if (!/^\d{6}$/.test(form.pincode)) return setErr('Enter a 6-digit pincode.');
    setErr(''); setBusy(true);
    try {
      const { id, ...rest } = form;
      await saveAddress({ ...rest, is_default: rest.is_default ? 1 : 0 }, id);
      setForm(null);
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : 'Could not save address.'); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Saved Addresses</h2>
        <button onClick={() => { setForm({ ...emptyAddr }); setErr(''); }} className={btnPrimary}>+ Add Address</button>
      </div>
      {form && (
        <form onSubmit={submit} className={`${card} mt-4 grid gap-4 sm:grid-cols-2`} noValidate>
          {[['full_name', 'Full Name', 'text'], ['mobile', 'Mobile Number', 'tel'], ['address', 'Address (house, street, area)', 'text'], ['city', 'City', 'text'], ['state', 'State', 'text'], ['pincode', 'Pincode', 'text']].map(([k, l, t]) => (
            <div key={k} className={k === 'address' ? 'sm:col-span-2' : ''}>
              <label htmlFor={`ad-${k}`} className="text-sm font-semibold">{l}</label>
              <input id={`ad-${k}`} type={t} value={String(form[k as keyof typeof form] ?? '')}
                onChange={e => setForm({ ...form, [k]: e.target.value })} className={fieldCls} />
            </div>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={!!form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked ? 1 : 0 })} className="h-4 w-4 accent-[#B08A57]" /> Set as default address
          </label>
          {err && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{err}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>{busy ? 'Saving…' : 'Save Address'}</button>
            <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-stone-200 px-6 py-2.5 text-sm font-semibold">Cancel</button>
          </div>
        </form>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {addresses.length === 0 && !form && <p className={`${card} text-sm text-stone-500 md:col-span-2`}>No saved addresses. Add one for faster checkout.</p>}
        {addresses.map(a => (
          <div key={a.id} className={card}>
            <div className="flex items-start justify-between gap-2">
              <b>{a.full_name}</b>
              {a.is_default ? <span className="rounded-full bg-[#EDE3D5] px-2.5 py-0.5 text-xs font-bold text-[#8B5E3C]">Default</span> : null}
            </div>
            <p className="mt-2 text-sm text-stone-500">{a.address}, {a.city}, {a.state} {a.pincode}<br />{a.mobile}</p>
            <div className="mt-3 flex gap-3 text-xs font-bold">
              <button onClick={() => { setForm({ ...a }); setErr(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[#8B5E3C] hover:underline">Edit</button>
              {!a.is_default && <button onClick={() => saveAddress({ ...a, is_default: 1 }, a.id)} className="text-[#8B5E3C] hover:underline">Set as Default</button>}
              <button onClick={() => { if (confirm('Delete this address?')) deleteAddress(a.id); }} className="flex items-center gap-1 text-red-600 hover:underline"><Trash2 size={12} /> Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab() {
  const { changePassword, logout, user } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ cur: '', next: '', next2: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (f.next.length < 8) return setMsg({ ok: false, text: 'New password must be at least 8 characters.' });
    if (f.next !== f.next2) return setMsg({ ok: false, text: 'New passwords do not match.' });
    setMsg(null); setBusy(true);
    try {
      await changePassword(f.cur, f.next);
      setMsg({ ok: true, text: 'Password updated successfully.' });
      setF({ cur: '', next: '', next2: '' });
    } catch (e2) { setMsg({ ok: false, text: e2 instanceof Error ? e2.message : 'Could not update password.' }); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className={card} noValidate>
        <h2 className="font-display text-xl">Change Password</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label htmlFor="pw-cur" className="text-sm font-semibold">Current Password</label>
            <input id="pw-cur" type="password" autoComplete="current-password" value={f.cur} onChange={e => setF({ ...f, cur: e.target.value })} className={fieldCls} /></div>
          <div><label htmlFor="pw-new" className="text-sm font-semibold">New Password</label>
            <input id="pw-new" type="password" autoComplete="new-password" value={f.next} onChange={e => setF({ ...f, next: e.target.value })} className={fieldCls} /></div>
          <div><label htmlFor="pw-new2" className="text-sm font-semibold">Confirm New Password</label>
            <input id="pw-new2" type="password" autoComplete="new-password" value={f.next2} onChange={e => setF({ ...f, next2: e.target.value })} className={fieldCls} /></div>
        </div>
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mt-4 rounded-lg p-3 text-sm ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
        <button disabled={busy} className={`${btnPrimary} mt-4 disabled:opacity-60`}>{busy ? 'Updating…' : 'Update Password'}</button>
      </form>
      <div className={card}>
        <h2 className="font-display text-xl">Session</h2>
        <p className="mt-1 text-sm text-stone-500">Signed in as {user!.email}. Sessions expire after {30} days with Remember me, otherwise 24 hours.</p>
        <button onClick={() => { logout(); nav('/'); }} className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 px-6 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50">
          <X size={15} /> Logout of this device
        </button>
      </div>
    </div>
  );
}

export function WishlistPage() {
  const { wishlist, moveToCart, toggleWishlist } = useShop();
  const saved = PRODUCTS.filter(p => wishlist.includes(p.id));
  return (
    <div><Navbar />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl">Wishlist</h1>
        {saved.length === 0 ? (
          <p className="mt-6 rounded-xl bg-white p-10 text-center text-sm text-stone-500">Nothing saved yet — tap the heart on any product.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {saved.map(p => (
              <div key={p.id}>
                <ProductCard p={p} />
                <div className="mt-2 flex gap-2">
                  <button onClick={() => moveToCart(p.id)} className="flex-1 rounded-lg bg-[#2A1912] py-2 text-xs font-bold text-white">Move to Cart</button>
                  <button onClick={() => toggleWishlist(p.id)} className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div><Footer /></div>
  );
}
