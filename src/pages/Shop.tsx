import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickView from '../components/QuickView';
import SearchOverlay from '../components/SearchOverlay';
import { CATEGORIES, COLLECTIONS, PRODUCTS, getCollection, matchesSub, productCollections } from '../lib/data';

type Sort = 'featured' | 'new' | 'low' | 'high' | 'rating';
const PAGE = 8;

/** Resolve ?category= / ?collection= / legacy ?cat= to a collection slug. */
function slugFromParams(params: URLSearchParams): string | null {
  const direct = params.get('collection') ?? params.get('category') ?? params.get('cat');
  if (!direct) return null;
  if (getCollection(direct)) return direct;
  const byName = COLLECTIONS.find(c => c.name.toLowerCase() === direct.toLowerCase());
  return byName ? byName.slug : null;
}

export default function Shop() {
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [collSlug, setCollSlug] = useState<string | null>(() => slugFromParams(params));
  const [sub, setSub] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(110000);
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<Sort>((params.get('sort') as Sort) ?? 'featured');
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    setCollSlug(slugFromParams(params));
    setSub(null); setShown(PAGE);
  }, [params]);

  const collection = collSlug ? getCollection(collSlug) : undefined;

  const list = useMemo(() => {
    let l = PRODUCTS.filter(p =>
      (!collSlug || productCollections(p).includes(collSlug)) &&
      (!sub || matchesSub(p, sub)) &&
      (cat === 'All' || p.category === cat) &&
      p.price <= maxPrice && p.rating >= minRating &&
      (!inStock || p.stock > 0) &&
      (q.trim() === '' || p.name.toLowerCase().includes(q.toLowerCase())));
    l = [...l].sort((a, b) =>
      sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price :
      sort === 'rating' ? b.rating - a.rating : sort === 'new' ? Number(b.newArrival ?? false) - Number(a.newArrival ?? false) : 0);
    return l;
  }, [q, cat, collSlug, sub, maxPrice, minRating, inStock, sort]);

  return (
    <div>
      <Navbar />
      {collection ? (
        <section className="relative overflow-hidden">
          <img src={collection.image} alt={collection.name} className="h-64 w-full object-cover sm:h-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2A1912]/85 via-[#2A1912]/45 to-transparent" />
          <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center px-4 text-[#FFF9F0] sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D8B98A]">
              <Link to="/" className="hover:underline">Home</Link> / <Link to="/shop" className="hover:underline">Shop</Link> / Collection
            </p>
            <h1 className="font-display mt-2 text-4xl uppercase sm:text-5xl">{collection.name}</h1>
            <p className="mt-2 max-w-md text-[#FFF9F0]/80">{collection.description}</p>
          </div>
        </section>
      ) : (
        <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B08A57]">Shop</p>
          <h1 className="font-display mt-2 text-4xl">Shop Furniture</h1>
          <p className="mt-2 text-stone-500">Explore furniture designed for modern living.</p>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {collection && (
          <div className="mb-8">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Subcategories">
              <button onClick={() => { setSub(null); setShown(PAGE); }} role="tab" aria-selected={sub === null}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${sub === null ? 'bg-[#2A1912] text-[#FFF9F0]' : 'border border-[#DCCBB8] bg-white hover:border-[#8B5E3C]'}`}>
                All
              </button>
              {collection.subcategories.map(s => (
                <button key={s.label} onClick={() => { setSub(s.match); setShown(PAGE); }} role="tab" aria-selected={sub === s.match}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${sub === s.match ? 'bg-[#2A1912] text-[#FFF9F0]' : 'border border-[#DCCBB8] bg-white hover:border-[#8B5E3C]'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-stone-500"><b className="text-[#241A15]">{list.length}</b> product{list.length !== 1 && 's'} in {collection.name}</p>
              <Link to="/shop" className="text-sm font-semibold text-[#8B5E3C] hover:underline">Clear collection ×</Link>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-xl border border-[#DCCBB8] bg-white p-5 lg:sticky lg:top-24" aria-label="Filters">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500" htmlFor="shop-q">Search</label>
            <input id="shop-q" value={q} onChange={e => { setQ(e.target.value); setShown(PAGE); }} placeholder="Sofa, bed…" className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-[#B08A57]" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-stone-500">Category</p>
            <div className="mt-2 space-y-1">
              {['All', ...CATEGORIES.map(c => c.name)].map(c => (
                <button key={c} onClick={() => { setCat(c); setShown(PAGE); }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${cat === c ? 'bg-[#2A1912] font-semibold text-white' : 'hover:bg-[#EDE3D5]'}`}>{c}</button>
              ))}
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-stone-500">Max price: ₹{maxPrice.toLocaleString('en-IN')}</p>
            <input type="range" min={3000} max={110000} step={1000} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} className="mt-2 w-full" aria-label="Maximum price" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-stone-500">Rating</p>
            <div className="mt-2 flex gap-2">
              {[0, 4, 4.5].map(r => (
                <button key={r} onClick={() => setMinRating(r)} className={`rounded-lg border px-3 py-1.5 text-sm ${minRating === r ? 'border-[#B08A57] bg-[#B08A57]/10 font-bold text-[#B08A57]' : 'border-stone-200'}`}>
                  {r === 0 ? 'All' : `${r}★+`}
                </button>
              ))}
            </div>
            <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="h-4 w-4 accent-[#B08A57]" /> In stock only</label>
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-500">{list.length} product{list.length !== 1 && 's'}</p>
              <label className="flex items-center gap-2 text-sm">Sort
                <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none" aria-label="Sort products">
                  <option value="featured">Featured</option><option value="new">Newest</option>
                  <option value="low">Price: Low to High</option><option value="high">Price: High to Low</option>
                  <option value="rating">Rating</option>
                </select>
              </label>
            </div>
            {list.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-stone-300 bg-white p-14 text-center">
                <p className="font-display text-2xl">Nothing matches those filters</p>
                <p className="mt-2 text-sm text-stone-500">Try widening the price range or clearing the search.</p>
                <button onClick={() => { setQ(''); setCat('All'); setSub(null); setMaxPrice(110000); setMinRating(0); setInStock(false); }} className="btn-lux btn-primary mt-5 rounded-lg px-6 py-2.5 text-sm font-semibold text-white">Clear filters</button>
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {list.slice(0, shown).map(p => <ProductCard key={p.id} p={p} />)}
                </div>
                {shown < list.length && (
                  <button onClick={() => setShown(s => s + PAGE)} className="mx-auto mt-8 block rounded-lg border border-[#2A1912] px-8 py-3 text-sm font-bold hover:bg-[#2A1912] hover:text-white">Load More</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer /><QuickView /><SearchOverlay />
    </div>
  );
}
