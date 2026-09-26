import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { API_BASE } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PRODUCTS, inr } from '../lib/data';
import { useShop } from '../lib/store';

interface Form { name: string; email: string; phone: string; address: string; city: string; state: string; pincode: string; pay: 'cod' | 'online' }

export default function Checkout() {
  const { cart, placeOrder, clearCart } = useShop();
  const { user, refreshOrders } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState<Form>({ name: '', email: '', phone: '', address: '', city: '', state: 'Tamil Nadu', pincode: '', pay: 'cod' });
  const [errs, setErrs] = useState<Partial<Form>>({});
  const [done, setDone] = useState<{ id: string; total: number } | null>(null);
  const rows = cart.map(i => ({ ...i, p: PRODUCTS.find(p => p.id === i.productId)! })).filter(r => r.p);
  const subtotal = rows.reduce((s, r) => s + r.p.price * r.qty, 0);
  const shipping = subtotal === 0 ? 0 : subtotal > 25000 ? 0 : 499;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  const set = (k: keyof Form, v: string) => setF(prev => ({ ...prev, [k]: v }));

  const [placing, setPlacing] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (placing) return;
    const errs: Partial<Form> = {};
    if (f.name.trim().length < 2) errs.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) errs.email = 'Enter a valid email';
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid 10-digit mobile number';
    if (f.address.trim().length < 6) errs.address = 'Enter your street address';
    if (f.city.trim().length < 2) errs.city = 'Enter your city';
    if (!/^\d{6}$/.test(f.pincode)) errs.pincode = 'Enter a 6-digit pincode';
    setErrs(errs);
    if (Object.keys(errs).length > 0 || rows.length === 0) return;
    // Logged-in users get a real server-side order; guests keep the local order.
    if (user) {
      setPlacing(true);
      try {
        const res = await fetch(`${API_BASE}/api/orders`, {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: rows.map(r => ({ product_id: r.p.id, name: r.p.name, price: r.p.price, qty: r.qty, size: r.size ?? null, color: r.color ?? null })),
            total, name: f.name, city: f.city,
          }),
        });
        if (!res.ok) throw new Error('Order failed');
        const out = await res.json();
        clearCart();
        await refreshOrders();
        setDone({ id: out.id, total });
      } catch {
        const o = placeOrder({ items: cart, total, name: f.name, city: f.city });
        setDone({ id: o.id, total });
      } finally { setPlacing(false); }
      return;
    }
    const o = placeOrder({ items: cart, total, name: f.name, city: f.city });
    setDone({ id: o.id, total });
  };

  if (done) return (
    <div><Navbar />
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl">✓</span>
        <h1 className="font-display mt-5 text-4xl">Order Confirmed</h1>
        <p className="mt-2 text-stone-500">Thank you! Your furniture is being prepared.</p>
        <div className="mt-6 rounded-xl border border-[#DCCBB8] bg-white p-6 text-left text-sm">
          <p><b>Order ID:</b> {done.id}</p>
          <p><b>Items:</b> {rows.reduce((s, r) => s + r.qty, 0)}</p>
          <p><b>Total paid:</b> {inr(done.total)} ({f.pay === 'cod' ? 'Cash on Delivery' : 'Online'})</p>
          <p><b>Deliver to:</b> {f.name}, {f.city} {f.pincode}</p>
        </div>
        <button onClick={() => nav('/shop')} className="mt-6 btn-lux btn-primary rounded-lg px-8 py-3 text-sm font-bold text-white">Continue Shopping</button>
      </div><Footer /></div>
  );

  const field = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`co-${k}`} className="text-sm font-semibold">{label}</label>
      <input id={`co-${k}`} value={f[k]} onChange={e => set(k, e.target.value)} {...props}
        className={`mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none ${errs[k] ? 'border-red-500' : 'border-stone-200 focus:border-[#B08A57]'}`} />
      {errs[k] && <p className="mt-1 text-xs text-red-600">{errs[k]}</p>}
    </div>
  );

  return (
    <div><Navbar />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl">Checkout</h1>
        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]" noValidate>
          <div className="space-y-6">
            <section className="rounded-xl border border-[#DCCBB8] bg-white p-6">
              <h2 className="font-semibold">Customer Information</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {field('name', 'Full Name', { autoComplete: 'name' })}
                {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
                <div className="sm:col-span-2">{field('phone', 'Phone', { inputMode: 'numeric', autoComplete: 'tel' })}</div>
              </div>
            </section>
            <section className="rounded-xl border border-[#DCCBB8] bg-white p-6">
              <h2 className="font-semibold">Shipping Address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">{field('address', 'Address')}</div>
                {field('city', 'City')}{field('state', 'State')}{field('pincode', 'Pincode', { inputMode: 'numeric' })}
              </div>
            </section>
            <section className="rounded-xl border border-[#DCCBB8] bg-white p-6">
              <h2 className="font-semibold">Payment Method</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {([['cod', 'Cash on Delivery', 'Pay when your furniture arrives'], ['online', 'Online Payment', 'UPI / Cards (demo placeholder)']] as const).map(([v, t, d]) => (
                  <label key={v} className={`cursor-pointer rounded-lg border p-4 ${f.pay === v ? 'border-[#B08A57] bg-[#B08A57]/5' : 'border-stone-200'}`}>
                    <input type="radio" name="pay" checked={f.pay === v} onChange={() => setF(prev => ({ ...prev, pay: v }))} className="accent-[#B08A57]" />
                    <span className="ml-2 text-sm font-bold">{t}</span><span className="mt-1 block text-xs text-stone-500">{d}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>
          <aside className="h-fit rounded-xl border border-[#DCCBB8] bg-white p-6 lg:sticky lg:top-24">
            <h2 className="font-semibold">Order Summary</h2>
            <div className="mt-3 max-h-56 space-y-2 overflow-auto text-sm">
              {rows.map(r => <div key={r.productId} className="flex justify-between gap-2"><span className="text-stone-500">{r.p.name} × {r.qty}</span><b>{inr(r.p.price * r.qty)}</b></div>)}
              {rows.length === 0 && <p className="text-stone-400">Cart is empty.</p>}
            </div>
            <div className="mt-4 space-y-2 border-t pt-3 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Subtotal</span><b>{inr(subtotal)}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Shipping</span><b>{shipping === 0 ? 'Free' : inr(shipping)}</b></div>
              <div className="flex justify-between"><span className="text-stone-500">Tax</span><b>{inr(tax)}</b></div>
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>{inr(total)}</span></div>
            </div>
            <button type="submit" disabled={placing} className="mt-5 w-full btn-lux btn-primary rounded-lg py-3 text-sm font-bold text-white hover:bg-[#B08A57] disabled:opacity-60">{placing ? 'Placing order…' : `Place Order · ${inr(total)}`}</button>
          </aside>
        </form>
      </div><Footer /></div>
  );
}


