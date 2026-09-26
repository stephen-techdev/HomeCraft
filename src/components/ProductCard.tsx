import { Check, Heart, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { discountPct, inr } from '../lib/data';
import type { Product } from '../lib/types';
import { useAuth } from '../lib/auth';
import { useShop } from '../lib/store';
import { Stars } from './ui';

export default function ProductCard({ p }: { p: Product }) {
  const { addToCart, wishlist, toggleWishlist } = useShop();
  const { requireAuth } = useAuth();
  const [added, setAdded] = useState(false);
  const wished = wishlist.includes(p.id);
  const off = discountPct(p);

  const handleAdd = () => {
    addToCart(p.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const altImg = (p.variants?.[1]?.images?.[0] ?? p.images[1] ?? p.images[0]);
  const moreColors = (p.variants?.length ?? p.colors.length) > 3;
  return (
    <article className="lux-card group overflow-hidden rounded-2xl border border-[#DCCBB8]/60 bg-[#FFF9F0]">
      <div className="relative overflow-hidden">
        <Link to={`/product/${p.id}`} aria-label={p.name} className="block relative h-60">
          <img src={p.images[0]} alt={p.name} loading="lazy" className="lux-img absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0" />
          <img src={altImg} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2A1912]/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {off > 0 && <span className="absolute left-3 top-3 rounded-full bg-[#2A1912] px-2.5 py-1 text-xs font-bold text-[#FFF9F0]">{off}% off</span>}
        <button onClick={() => requireAuth(() => toggleWishlist(p.id))} aria-label="Toggle wishlist" aria-pressed={wished}
          className={`glass-btn absolute right-3 top-3 rounded-full p-2 shadow-md transition-all duration-300 hover:scale-110 ${wished ? 'text-[#8B5E3C]' : 'text-stone-600 hover:text-[#8B5E3C]'}`}>
          <Heart size={17} fill={wished ? 'currentColor' : 'none'} />
        </button>
        {moreColors && <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#2A1912] shadow">More Colors</span>}
      </div>
      <div className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B5E3C]">{p.category}</p>
        <Link to={`/product/${p.id}`} className="font-display mt-1 block text-lg leading-snug transition-colors hover:text-[#8B5E3C]">{p.name}</Link>
        <div className="mt-1 flex items-center gap-2 text-xs text-stone-500"><Stars value={p.rating} /><span>({p.reviews})</span></div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold">{inr(p.price)}</span>
          {p.oldPrice && <s className="text-sm text-stone-400">{inr(p.oldPrice)}</s>}
        </div>
        <button onClick={handleAdd}
          className={`btn-lux mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold ${added ? 'bg-[#5a7a3a] text-white' : 'btn-primary'}`}>
          {added ? <><Check size={16} /> Added!</> : <><ShoppingBag size={16} /> Add to Cart</>}
        </button>
      </div>
    </article>
  );
}
