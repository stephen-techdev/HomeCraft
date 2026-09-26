import { Check, Heart, Minus, Plus, ShoppingBag, Truck, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickView from '../components/QuickView';
import SearchOverlay from '../components/SearchOverlay';
import { Stars } from '../components/ui';
import { PRODUCTS, discountPct, inr } from '../lib/data';
import { useShop } from '../lib/store';
import type { ProductVariant } from '../lib/types';

export default function ProductDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addToCart, wishlist, toggleWishlist } = useShop();
  const p = useMemo(() => PRODUCTS.find(x => x.id === id), [id]);
  const [qty, setQty] = useState(1);
  const [sizeIdx, setSizeIdx] = useState(0);

  // ---- variant system (spec Part 2) + rotation fallback ----
  const variants: ProductVariant[] = useMemo(() => {
    if (!p) return [];
    if (p.variants && p.variants.length) return p.variants;
    const rot = (p as unknown as { rotationImages?: string[] }).rotationImages;
    return p.colors.map((c, i) => ({ id: `${p.id}__${i}`, colorName: c, colorValue: c, images: p.images, rotationImages: rot }));
  }, [p]);
  const [variantIdx, setVariantIdx] = useState(0);
  const activeVariant = variants[variantIdx] ?? variants[0];
  const gallery = activeVariant?.images ?? p?.images ?? [];
  const [imgIdx, setImgIdx] = useState(0);
  const [showAllColors, setShowAllColors] = useState(false);
  // reset image when variant changes
  useEffect(() => { setImgIdx(0); }, [variantIdx]);
  // keep variant aligned with existing product color list on mount
  useEffect(() => { setVariantIdx(0); }, [id]);



  // ---- rotation frames (spec: use ordered multi-angle frames, fallback to gallery) ----
  // Keep existing gallery for thumbnails; rotation uses ordered frames that cycle
  const rotationFrames = useMemo(() => {
    if (!p) return [];
    // variant rotation takes precedence, then product rotation, then gallery fallback
    const vRot = (activeVariant as ProductVariant & { rotationImages?: string[] })?.rotationImages;
    const pRot = (p as unknown as { rotationImages?: string[] }).rotationImages;
    const frames = (vRot && vRot.length > 0) ? vRot : (pRot && pRot.length > 0) ? pRot : gallery;
    return frames;
  }, [p, activeVariant, gallery]);
  const rotatable = rotationFrames.length > 1;
  // frame index for rotation (independent of thumbnail imgIdx when rotationImages differ)
  const [frame, setFrame] = useState(0);
  useEffect(() => { setFrame(0); setImgIdx(0); }, [variantIdx, id]);
  // keep imgIdx in sync with frame for thumbnail highlight when using rotation frames
  const displayIdx = rotatable ? frame : imgIdx;
  const displayFrames = rotatable ? rotationFrames : gallery;

  // preload rotation frames for selected variant/product only
  useEffect(() => {
    displayFrames.forEach(src => { const im = new Image(); im.src = src; });
  }, [displayFrames]);


  // drag state — horizontal = rotation, vertical = page scroll
  const dragRef = useRef<{ x: number; y: number; startFrame: number; dragging: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const PIXELS_PER_FRAME = 28;
  const onPointerDown = (e: React.PointerEvent) => {
    if (!rotatable) return;
    const t = e.currentTarget as HTMLElement;
    t.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, startFrame: frame, dragging: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = dragRef.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.dragging) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) { dragRef.current = null; return; } // vertical → scroll
      s.dragging = true; setDragging(true);
    }
    if (s.dragging) {
      e.preventDefault();
      const steps = Math.round(dx / PIXELS_PER_FRAME);
      // drag LEFT (negative dx) → next frame; drag RIGHT → previous (wrap)
      let next = (s.startFrame + -steps) % rotationFrames.length;
      if (next < 0) next += rotationFrames.length;
      if (next !== frame) {
        setFrame(next);
        if (rotatable) setImgIdx(next % gallery.length);
      }
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = dragRef.current;
    if (s?.dragging) e.preventDefault();
    dragRef.current = null;
    setDragging(false);
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };
  // touch fallback uses pointer events on modern mobile, but keep legacy handlers for older browsers
  const onTouchStartLegacy = (e: React.TouchEvent) => {
    const t = e.touches[0]; dragRef.current = { x: t.clientX, y: t.clientY, startFrame: frame, dragging: false };
  };
  const onTouchMoveLegacy = (e: React.TouchEvent) => {
    const s = dragRef.current; if (!s) return;
    const t = e.touches[0]; const dx = t.clientX - s.x; const dy = t.clientY - s.y;
    if (!s.dragging) {
      if (Math.abs(dy) > Math.abs(dx)) { dragRef.current = null; return; }
      if (Math.abs(dx) < 10) return;
      s.dragging = true; setDragging(true);
    }
    e.preventDefault();
    const steps = Math.round(dx / PIXELS_PER_FRAME);
    let next = (s.startFrame + -steps) % rotationFrames.length;
    if (next < 0) next += rotationFrames.length;
    setFrame(next);
  };
  const onTouchEndLegacy = () => { dragRef.current = null; setDragging(false); };

  if (!p) return <div className="p-20 text-center">Product not found. <Link to="/shop" className="underline">Back to shop</Link></div>;
  const wished = wishlist.includes(p.id);
  const related = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
  const price = activeVariant?.price ?? p.price;
  const stock = activeVariant?.stock ?? p.stock;
  const visibleColors = showAllColors ? variants : variants.slice(0, 4);
  const hasMoreColors = variants.length > 4;

  return (
    <div className="page-enter">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-sm text-stone-400"><Link to="/" className="hover:underline">Home</Link> / <Link to="/shop" className="hover:underline">Shop</Link> / {p.name}</p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_460px]">
          {/* main image — manual drag rotation only, no thumbnails */}
          <div>
            <div
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
              onTouchStart={onTouchStartLegacy} onTouchMove={onTouchMoveLegacy} onTouchEnd={onTouchEndLegacy}
              className={`group relative overflow-hidden rounded-2xl border border-[#DCCBB8] bg-white select-none touch-pan-y ${rotatable ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
              style={{ touchAction: rotatable ? 'pan-y' : 'auto' }}
              aria-label="Product image viewer">
              {/* stable product presentation — centered, no stretch, no jump */}
              <div className="relative flex h-[380px] items-center justify-center bg-[#FFF9F0] p-3 sm:h-[480px] overflow-hidden">
                <img
                  key={`${variantIdx}-${displayIdx}`}
                  src={displayFrames[displayIdx]} alt={p.name}
                  className={`max-h-full max-w-full object-contain transition-opacity duration-150 ${displayIdx === 0 ? 'front-breathe' : ''}`}
                  draggable={false}
                />
                {/* subtle vignette */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.06] via-transparent to-transparent" />
              </div>



            </div>
          </div>

          {/* info */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-stone-400">{p.category}</p>
            <h1 className="font-display mt-1 text-3xl sm:text-4xl">{p.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-stone-500"><Stars value={p.rating} /><span>{p.rating} · {p.reviews} reviews</span></div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold">{inr(price)}</span>
              {p.oldPrice && <><s className="text-lg text-stone-400">{inr(p.oldPrice)}</s><span className="rounded-full bg-green-100 px-2.5 py-1 text-sm font-bold text-green-800">{discountPct(p)}% off</span></>}
            </div>
            <p className="mt-4 leading-relaxed text-stone-600">{p.description}</p>

            {/* variant selector */}
            <div className="mt-5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Colour: <span className="font-normal text-stone-500">{activeVariant?.colorName}</span></p>
                {hasMoreColors && !showAllColors && <span className="text-xs text-stone-400">+{variants.length - 4} more</span>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {visibleColors.map((v) => {
                  const gIdx = variants.indexOf(v);
                  return (
                    <button key={v.id} onClick={() => setVariantIdx(gIdx)} aria-pressed={variantIdx === gIdx} aria-label={`Colour ${v.colorName}`}
                      className={`relative h-9 w-9 rounded-full border-2 transition-all duration-300 ${variantIdx === gIdx ? 'border-[#B08A57] scale-110 shadow-md' : 'border-stone-200 hover:border-stone-400'}`}
                      style={{ background: v.colorValue }}>
                      {variantIdx === gIdx && <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow" />}
                    </button>
                  );
                })}
                {hasMoreColors && (
                  <button onClick={() => setShowAllColors(v => !v)}
                    className="rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-bold transition hover:border-[#2A1912] hover:bg-[#2A1912] hover:text-white">
                    {showAllColors ? 'Show less' : `More Colors +${variants.length - 4}`}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold">Size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.sizes.map((s, i) => (
                  <button key={s} onClick={() => setSizeIdx(i)} className={`rounded-lg border px-4 py-2 text-sm transition ${sizeIdx === i ? 'border-[#2A1912] bg-[#2A1912] font-semibold text-white' : 'border-stone-200 hover:border-stone-400'}`}>{s}</button>
                ))}
              </div>
            </div>

            <p className={`mt-5 flex items-center gap-1.5 text-sm font-semibold ${stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
              {stock > 0 ? <><Check size={16} /> In stock — {stock} left{activeVariant ? ` · ${activeVariant.colorName}` : ''}</> : 'Out of stock'}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-stone-200">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-3 hover:bg-stone-50" aria-label="Decrease quantity"><Minus size={16} /></button>
                <span className="w-8 text-center font-bold" aria-live="polite">{qty}</span>
                <button onClick={() => setQty(q => Math.min(stock, q + 1))} className="p-3 hover:bg-stone-50" aria-label="Increase quantity"><Plus size={16} /></button>
              </div>
              <button onClick={() => addToCart(p.id, qty, p.sizes[sizeIdx], activeVariant?.colorValue ?? p.colors[0])} className="btn-lux btn-primary flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-bold text-white hover:bg-[#B08A57]">
                <ShoppingBag size={17} /> Add to Cart
              </button>
              <button onClick={() => toggleWishlist(p.id)} aria-label="Toggle wishlist" className={`rounded-lg border p-3.5 transition ${wished ? 'border-[#B08A57] text-[#B08A57]' : 'border-stone-200 hover:border-stone-300'}`}>
                <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
              </button>
            </div>
            <button onClick={() => { addToCart(p.id, qty, p.sizes[sizeIdx], activeVariant?.colorValue ?? p.colors[0]); nav('/checkout'); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#B08A57] py-3.5 text-sm font-bold text-white hover:bg-[#2A1912]">
              <Zap size={17} /> Buy Now
            </button>
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-[#EDE3D5] p-4 text-sm"><Truck size={18} className="shrink-0 text-[#B08A57]" /> Free delivery & installation · 7-day returns · 5-year warranty</div>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[['Description', p.description], ['Specifications', `Solid frame · ${p.sizes.join('/')} · Colours: ${variants.length} · Weight-tested to 120kg per seat.`], ['Delivery & Returns', 'Dispatched in 2–4 days. Free installation across Tamil Nadu. 7-day easy returns.']].map(([t, d]) => (
            <div key={t} className="reveal rounded-xl border border-[#DCCBB8] bg-white p-6"><h3 className="font-semibold">{t}</h3><p className="mt-2 text-sm leading-relaxed text-stone-500">{d}</p></div>
          ))}
        </div>

        {related.length > 0 && (
          <div className="mt-14"><h2 className="font-display text-2xl">Related Products</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map(r => <ProductCard key={r.id} p={r} />)}</div>
          </div>
        )}
      </div>

      <Footer /><QuickView /><SearchOverlay />
    </div>
  );
}
