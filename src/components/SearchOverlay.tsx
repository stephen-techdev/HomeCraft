import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS, inr } from '../lib/data';
import { useShop } from '../lib/store';

export default function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useShop();
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return PRODUCTS.filter(p => p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s)).slice(0, 7);
  }, [q]);
  if (!searchOpen) return null;

  return (
    <div className="overlay-in fixed inset-0 z-50 bg-[#2A1912]/50 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
      <div className="mx-auto mt-20 w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search">
        <div className="flex items-center gap-2 border-b p-4">
          <Search size={20} className="text-stone-400" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search sofas, beds, dining…" className="w-full bg-transparent text-lg outline-none placeholder:text-stone-400" aria-label="Search products" />
          <button onClick={() => setSearchOpen(false)} className="rounded-full p-1.5 hover:bg-stone-100" aria-label="Close search"><X size={18} /></button>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {q.trim() === '' && <p className="p-4 text-sm text-stone-400">Try “sofa”, “bed”, “lamp”…</p>}
          {q.trim() !== '' && results.length === 0 && (
            <div className="p-6 text-center"><p className="font-display text-lg">No matches for “{q}”</p><p className="mt-1 text-sm text-stone-500">Try a different term or browse the shop.</p></div>
          )}
          {results.map(p => (
            <Link key={p.id} to={`/product/${p.id}`} onClick={() => { setSearchOpen(false); setQ(''); }} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[#F5EFE6]">
              <img src={p.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{p.name}</p><p className="text-xs text-stone-400">{p.category}</p></div>
              <span className="ml-auto text-sm font-bold">{inr(p.price)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

