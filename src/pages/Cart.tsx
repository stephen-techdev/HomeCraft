import { ArrowRight, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import QuickView from '../components/QuickView';
import SearchOverlay from '../components/SearchOverlay';
import { PRODUCTS, inr } from '../lib/data';
import { useShop } from '../lib/store';

export default function Cart() {
  const { cart, setQty, removeFromCart, moveToCart } = useShop();
  const nav = useNavigate();
  const rows = cart.map(i => ({ ...i, p: PRODUCTS.find(p => p.id === i.productId)! })).filter(r => r.p);
  const subtotal = rows.reduce((s, r) => s + r.p.price * r.qty, 0);
  const mrp = rows.reduce((s, r) => s + (r.p.oldPrice ?? r.p.price) * r.qty, 0);
  const discount = mrp - subtotal;
  const shipping = subtotal === 0 ? 0 : subtotal > 25000 ? 0 : 499;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl">Your Cart</h1>
        {rows.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-stone-300 bg-white p-14 text-center">
            <p className="font-display text-2xl">Your cart is empty</p>
            <p className="mt-2 text-sm text-stone-500">Beautiful rooms start with a single piece.</p>
            <button onClick={() => nav('/shop')} className="mt-5 btn-lux btn-primary rounded-lg px-6 py-2.5 text-sm font-semibold text-white">Continue Shopping</button>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {rows.map(r => (
                <div key={r.productId + (r.size ?? '')} className="flex gap-4 rounded-xl border border-[#DCCBB8] bg-white p-4">
                  <Link to={`/product/${r.p.id}`}><img src={r.p.images[0]} alt={r.p.name} className="h-24 w-24 rounded-lg object-cover" /></Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${r.p.id}`} className="font-semibold hover:text-[#B08A57]">{r.p.name}</Link>
                    <p className="text-xs text-stone-400">{r.p.category}{r.size ? ` · ${r.size}` : ''}</p>
                    <p className="mt-1 font-bold">{inr(r.p.price)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <div className="flex items-center rounded-lg border border-stone-200 text-sm">
                        <button onClick={() => setQty(r.productId, r.qty - 1)} className="px-3 py-1.5" aria-label="Decrease">−</button>
                        <span className="w-6 text-center font-bold">{r.qty}</span>
                        <button onClick={() => setQty(r.productId, r.qty + 1)} className="px-3 py-1.5" aria-label="Increase">+</button>
                      </div>
                      <button onClick={() => moveToCart(r.productId)} className="text-xs font-semibold text-[#B08A57] hover:underline">Move to wishlist</button>
                      <button onClick={() => removeFromCart(r.productId)} className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline" aria-label={`Remove ${r.p.name}`}><Trash2 size={13} /> Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <aside className="h-fit rounded-xl border border-[#DCCBB8] bg-white p-6 lg:sticky lg:top-24" aria-label="Order summary">
              <h2 className="font-semibold">Order Summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd className="font-semibold">{inr(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-stone-500">Discount</dt><dd className="font-semibold text-green-700">− {inr(discount)}</dd></div>
                <div className="flex justify-between"><dt className="text-stone-500">Shipping</dt><dd className="font-semibold">{shipping === 0 ? 'Free' : inr(shipping)}</dd></div>
                <div className="flex justify-between"><dt className="text-stone-500">Tax (5%)</dt><dd className="font-semibold">{inr(tax)}</dd></div>
                <div className="flex justify-between border-t pt-3 text-base font-bold"><dt>Total</dt><dd>{inr(total)}</dd></div>
              </dl>
              <button onClick={() => nav('/checkout')} className="mt-5 flex w-full items-center justify-center gap-2 btn-lux btn-primary rounded-lg py-3 text-sm font-bold text-white hover:bg-[#B08A57]">Proceed to Checkout <ArrowRight size={16} /></button>
              <button onClick={() => nav('/shop')} className="mt-2 w-full rounded-lg border border-stone-200 py-3 text-sm font-semibold hover:border-stone-400">Continue Shopping</button>
            </aside>
          </div>
        )}
      </div>
      <Footer /><QuickView /><SearchOverlay />
    </div>
  );
}


