import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { useAuth } from '../lib/auth';

const SIDE_IMG = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop';
const inputCls = (bad: boolean) =>
  `mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors ${bad ? 'border-red-500' : 'border-stone-200 focus:border-[#B08A57]'}`;

function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div><Navbar />
      <div className="mx-auto grid max-w-6xl gap-0 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-14">
        <div className="relative hidden overflow-hidden rounded-l-2xl lg:block">
          <img src={SIDE_IMG} alt="HomeCraft premium interior" className="kenburns h-full min-h-[560px] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A1912]/85 via-[#2A1912]/25 to-transparent" />
          <div className="absolute bottom-0 p-10 text-[#FFF9F0]">
            <p className="font-display text-3xl">Home<span className="text-[#D8B98A]">Craft</span></p>
            <p className="mt-2 text-sm text-white/80">Furniture Crafted for Better Living</p>
          </div>
        </div>
        <div className="rounded-2xl border border-[#DCCBB8] bg-[#FFF9F0] p-6 sm:p-10 lg:rounded-l-none">
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-stone-500">{sub}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div><Footer /></div>
  );
}

function BackendNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">Unable to connect to the account server. Please try again.</p>;
}

function strength(pw: string): { label: string; pct: number; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 2) return { label: 'Weak', pct: 33, color: '#c0392b' };
  if (s <= 3) return { label: 'Fair', pct: 55, color: '#B98252' };
  if (s <= 4) return { label: 'Good', pct: 80, color: '#5a7a3a' };
  return { label: 'Strong', pct: 100, color: '#2e7d32' };
}

export function Login() {
  const { login, backendUp } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') ?? '/account';
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Dev admin uses identifier `admin@123` (no TLD) — exempt it from the public email regex.
  const isAdminIdentifier = (v: string) => v.trim().toLowerCase() === 'admin@123';
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const raw = email.trim();
    if (!isAdminIdentifier(raw) && !/^\S+@\S+\.\S+$/.test(raw)) return setErr('Please enter a valid email address.');
    if (!pw) return setErr('Please enter your password.');
    setErr(''); setBusy(true);
    try {
      const u = await login(raw, pw, remember);
      if (u.role === 'admin') nav('/admin');
      else nav(next);
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : 'Your account could not be authenticated.';
      // Normalize to the spec-required strings; also surface offline vs auth failure distinctly.
      if ((e2 as { code?: string })?.code === 'offline') setErr('Unable to connect to the account server. Please try again.');
      else if (msg === 'Invalid email or password.') setErr('Invalid login credentials.');
      else setErr(msg);
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Welcome back" sub="Log in to track orders, sync your wishlist and check out faster.">
      <BackendNotice show={!backendUp} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="li-email" className="text-sm font-semibold">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input id="li-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
              className={`${inputCls(!!err && !email)} pl-9`} placeholder="you@example.com" />
          </div>
        </div>
        <div>
          <label htmlFor="li-pw" className="text-sm font-semibold">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input id="li-pw" type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)}
              className={`${inputCls(false)} pl-9 pr-11`} placeholder="••••••••" />
            <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#241A15]" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-stone-500">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="h-4 w-4 accent-[#B08A57]" /> Remember me
          </label>
          <Link to="/contact" className="font-semibold text-[#8B5E3C] hover:underline">Forgot Password?</Link>
        </div>
        {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
        <button disabled={busy} className="btn-lux btn-primary w-full rounded-lg py-3 text-sm font-bold disabled:opacity-60">
          {busy ? 'Signing in…' : 'Login'}
        </button>
        <p className="text-center text-sm text-stone-500">Don&apos;t have an account? <Link to={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-[#8B5E3C] hover:underline">Create Account</Link></p>
      </form>
    </AuthShell>
  );
}

const GENDERS = [['male', 'Male'], ['female', 'Female'], ['other', 'Other'], ['prefer_not_to_say', 'Prefer not to say']] as const;

export function AdminLogin() {
  const { adminLogin, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@123');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') nav('/admin');
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr(''); setBusy(true);
    try {
      await adminLogin(email.trim(), pw);
      nav('/admin');
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : 'Sign-in failed.';
      if ((e2 as { code?: string })?.code === 'offline') setErr('Unable to connect to the account server. Please try again.');
      else if (msg === 'Invalid email or password.') setErr('Invalid login credentials.');
      else setErr(msg);
    } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[#2A1912] px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-[#FFF9F0] p-8" noValidate>
        <p className="font-display text-2xl">Home<span className="text-[#8B5E3C]">Craft</span> <span className="text-sm font-normal text-stone-400">Admin</span></p>
        <p className="mt-1 text-sm text-stone-500">Restricted area. Admin credentials only.</p>
        <div className="mt-6 space-y-4">
          <div><label htmlFor="ad-email" className="text-sm font-semibold">Email</label>
            <input id="ad-email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username"
              className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#B08A57]" /></div>
          <div><label htmlFor="ad-pw" className="text-sm font-semibold">Password</label>
            <input id="ad-pw" type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password"
              className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#B08A57]" /></div>
        </div>
        {err && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
        <button disabled={busy} className="btn-lux btn-primary mt-5 w-full rounded-lg py-3 text-sm font-bold disabled:opacity-60">
          {busy ? 'Signing in…' : 'Admin Login'}</button>
        <button type="button" onClick={() => nav('/')} className="mt-2 w-full py-2 text-sm font-semibold text-stone-400 hover:text-[#241A15]">← Back to store</button>
      </form>
    </div>
  );
}

export function Register() {
  const { register, backendUp } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') ?? '/account';
  const [f, setF] = useState({ name: '', email: '', phone: '', gender: 'prefer_not_to_say', pw: '', pw2: '' });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => { setF(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: '' })); };
  const st = useMemo(() => strength(f.pw), [f.pw]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (f.name.trim().length < 2 || f.name.trim().length > 80) errs.name = 'Please enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) errs.email = 'Please enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\s/g, ''))) errs.phone = 'Please enter a valid 10-digit Indian mobile number.';
    if (f.pw.length < 8) errs.pw = 'Password must be at least 8 characters.';
    if (f.pw2 !== f.pw) errs.pw2 = 'Passwords do not match.';
    setErrs(errs);
    if (Object.keys(errs).length > 0) return;
    setBusy(true);
    try {
      await register({ full_name: f.name.trim(), email: f.email.trim(), mobile: f.phone.replace(/\s/g, ''), gender: f.gender, password: f.pw });
      nav(next);
    } catch (e2) {
      setErrs({ form: e2 instanceof Error ? e2.message : 'Registration failed. Please try again.' });
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create Account" sub="Join HomeCraft for order tracking, synced wishlist and faster checkout.">
      <BackendNotice show={!backendUp} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="rg-name" className="text-sm font-semibold">Full Name</label>
          <input id="rg-name" autoComplete="name" value={f.name} onChange={e => set('name', e.target.value)} className={inputCls(!!errs.name)} placeholder="Aarav Sharma" />
          {errs.name && <p className="mt-1 text-xs text-red-600">{errs.name}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rg-email" className="text-sm font-semibold">Email Address</label>
            <input id="rg-email" type="email" autoComplete="email" value={f.email} onChange={e => set('email', e.target.value)} className={inputCls(!!errs.email)} placeholder="you@example.com" />
            {errs.email && <p className="mt-1 text-xs text-red-600">{errs.email}</p>}
          </div>
          <div>
            <label htmlFor="rg-phone" className="text-sm font-semibold">Mobile Number</label>
            <input id="rg-phone" inputMode="numeric" autoComplete="tel" value={f.phone} onChange={e => set('phone', e.target.value)} className={inputCls(!!errs.phone)} placeholder="98400 12345" />
            {errs.phone && <p className="mt-1 text-xs text-red-600">{errs.phone}</p>}
          </div>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">Gender <span className="font-normal text-stone-400">(optional)</span></legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {GENDERS.map(([v, l]) => (
              <button type="button" key={v} onClick={() => set('gender', v)} aria-pressed={f.gender === v}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${f.gender === v ? 'border-[#2A1912] bg-[#2A1912] font-semibold text-white' : 'border-stone-200 hover:border-[#8B5E3C]'}`}>{l}</button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rg-pw" className="text-sm font-semibold">Password</label>
            <input id="rg-pw" type="password" autoComplete="new-password" value={f.pw} onChange={e => set('pw', e.target.value)} className={inputCls(!!errs.pw)} placeholder="Min. 8 characters" />
            {f.pw && (
              <div className="mt-2" aria-live="polite">
                <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
                  <div className="h-full rounded-full transition-all" style={{ width: `${st.pct}%`, background: st.color }} />
                </div>
                <p className="mt-1 text-xs" style={{ color: st.color }}>Strength: {st.label}</p>
              </div>
            )}
            {errs.pw && <p className="mt-1 text-xs text-red-600">{errs.pw}</p>}
          </div>
          <div>
            <label htmlFor="rg-pw2" className="text-sm font-semibold">Confirm Password</label>
            <input id="rg-pw2" type="password" autoComplete="new-password" value={f.pw2} onChange={e => set('pw2', e.target.value)} className={inputCls(!!errs.pw2)} placeholder="Repeat password" />
            {errs.pw2 && <p className="mt-1 text-xs text-red-600">{errs.pw2}</p>}
          </div>
        </div>
        {errs.form && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errs.form}</p>}
        <button disabled={busy} className="btn-lux btn-primary w-full rounded-lg py-3 text-sm font-bold disabled:opacity-60">
          {busy ? 'Creating account…' : 'Create Account'}
        </button>
        <p className="text-center text-sm text-stone-500">Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-[#8B5E3C] hover:underline">Login</Link></p>
      </form>
    </AuthShell>
  );
}
