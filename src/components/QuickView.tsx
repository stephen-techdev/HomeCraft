import { Heart, ShoppingBag, X } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS, discountPct, inr } from '../lib/data';
import { useShop } from '../lib/store';
import { Stars } from './ui';

export default function QuickView() {
  const { quickViewId, setQuickViewId, addToCart, wishlist, toggleWishlist } = useShop();
  const p = useMemo(() => PRODUCTS.find(x => x.id === quickViewId) ?? null, [quickViewId]);
  if (!p) return null;
  const wished = wishlist.includes(p.id);

  return (
    <div className="overlay-in fixed inset-0 z-50 grid place-items-center bg-[#2A1912]/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={p.name} onClick={() => setQuickViewId(null)}>
      <div className="modal-in grid w-full max-w-3xl overflow-hidden rounded-2xl bg-[#FFF9F0] md:grid-cols-2" onClick={e => e.stopPropagation()}>
        <img src={p.images[0]} alt={p.name} className="h-64 w-full object-cover md:h-full md:min-h-[380px]" />
        <div className="relative p-6 sm:p-8">
          <button onClick={() => setQuickViewId(null)} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-stone-100" aria-label="Close"><X size={18} /></button>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-400">{p.category}</p>
          <h3 className="font-display mt-1 text-2xl">{p.name}</h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-stone-500"><Stars value={p.rating} /><span>{p.rating} · {p.reviews} reviews</span></div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{inr(p.price)}</span>
            {p.oldPrice && <><s className="text-stone-400">{inr(p.oldPrice)}</s><span className="text-sm font-bold text-green-700">{discountPct(p)}% off</span></>}
          </div>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-500">{p.description}</p>
          <div className="mt-5 flex gap-2">
            <button onClick={() => { addToCart(p.id); setQuickViewId(null); }} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2A1912] py-3 text-sm font-semibold text-white hover:bg-[#B08A57]">
              <ShoppingBag size={16} /> Add to Cart
            </button>
            <button onClick={() => toggleWishlist(p.id)} aria-label="Toggle wishlist"
              className={`rounded-lg border px-3.5 ${wished ? 'border-[#B08A57] bg-[#B08A57]/10 text-[#B08A57]' : 'border-stone-200'}`}>
              <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
            </button>
          </div>
          <Link to={`/product/${p.id}`} onClick={() => setQuickViewId(null)} className="mt-4 block text-center text-sm font-semibold text-[#B08A57] hover:underline">View full details →</Link>
        </div>
      </div>
    </div>
  );
}

