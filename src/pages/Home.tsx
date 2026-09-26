import { ArrowRight, Award, RefreshCcw, Ruler, Truck } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import QuickView from '../components/QuickView';
import SearchOverlay from '../components/SearchOverlay';
import { Reveal, SectionHeading, Stars } from '../components/ui';
import { COLLECTIONS, PRODUCTS, REVIEWS } from '../lib/data';

function Hero() {
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // Same parallax as before, throttled to one write per frame so scrolling stays smooth.
    let ticking = false;
    const paint = () => {
      ticking = false;
      if (imgRef.current) imgRef.current.style.transform = `scale(1.05) translateY(${window.scrollY * 0.08}px)`;
    };
    const f = () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
    window.addEventListener('scroll', f, { passive: true });
    paint();
    return () => window.removeEventListener('scroll', f);
  }, []);

  return (
    <section className="page-enter relative overflow-hidden bg-[#2A1912]">
      {/* slow zoom lives on the wrapper, scroll parallax on the image — both run at once */}
      <div className="kenburns">
        <img ref={imgRef} src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2000&auto=format&fit=crop"
          alt="Luxury HomeCraft living room in warm walnut tones" className="h-[84vh] min-h-[560px] w-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#2A1912]/85 via-[#3A2418]/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#F5EFE6] to-transparent" />
      <div className="absolute inset-0 mx-auto flex max-w-7xl items-center px-4 sm:px-6">
        <div className="hero-rise max-w-xl text-[#FFF9F0]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#D8B98A]">HomeCraft</p>
          <h1 className="font-display mt-4 text-4xl leading-[1.1] sm:text-6xl">Furniture Crafted for Better Living</h1>
          <p className="mt-4 max-w-md text-[#FFF9F0]/80">Discover thoughtfully designed furniture that brings comfort, character, and timeless style into your home.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="btn-lux btn-primary rounded-lg px-8 py-4 text-sm font-bold">Shop Collection</Link>
            <Link to="/#categories" className="btn-lux rounded-lg border border-[#FFF9F0]/50 px-8 py-4 text-sm font-bold text-[#FFF9F0] backdrop-blur-sm hover:border-[#B08A57] hover:text-[#D8B98A]">Explore Categories</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const best = PRODUCTS.filter(p => p.featured).slice(0, 8);

  return (
    <div>
      <Navbar />
      <Hero />

      {/* COLLECTIONS */}
      <section id="categories" className="wood-grain-light mx-auto max-w-7xl scroll-mt-24 rounded-3xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="Catalog" title="Shop by Collection" sub="Ten curated collections — from everyday living to statement luxury." />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COLLECTIONS.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 4) * 90}>
              <Link to={c.slug === 'premium' ? `/shop?collection=${c.slug}` : `/shop?category=${c.slug}`} className="group relative block overflow-hidden rounded-2xl shadow-lg shadow-[#2A1912]/15 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#2A1912]/25">
                <img src={c.image} alt={c.name} loading="lazy" className="h-72 w-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2A1912]/85 via-[#2A1912]/15 to-transparent transition-all duration-500 group-hover:from-[#2A1912]/95" />
                <div className="absolute bottom-0 p-6 text-[#FFF9F0] transition-transform duration-500 group-hover:-translate-y-1">
                  <h3 className="font-display text-2xl">{c.name}</h3>
                  <p className="mt-1 text-sm text-white/75">{c.description}</p>
                  <span className="mt-3 inline-flex translate-y-1 items-center gap-1.5 text-sm font-semibold text-[#D8B98A] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100">Explore Collection <ArrowRight size={15} /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* COLLECTION EDITORIAL */}
      <section id="collections" className="wood-grain grain-overlay scroll-mt-24 text-[#FFF9F0]">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div className="float-glow pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#B98252]/20 blur-3xl" />
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D8B98A]">The New Collection</p>
            <h2 className="font-display mt-3 text-3xl leading-tight sm:text-5xl">Designed for modern spaces. Crafted for everyday living.</h2>
            <p className="mt-4 max-w-md text-[#FFF9F0]/70">Solid woods, honest weaves and brass details — a capsule of pieces that settle beautifully into Indian homes.</p>
            <Link to="/shop?sort=new" className="btn-lux mt-8 inline-block rounded-lg bg-[#B98252] px-8 py-4 text-sm font-bold text-[#2A1912] hover:bg-[#FFF9F0]">Explore Collection</Link>
          </Reveal>
          <Reveal scale>
            <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop" alt="New collection interior" loading="lazy" className="h-[420px] w-full rounded-2xl border border-white/10 object-cover shadow-2xl" />
          </Reveal>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="mx-auto max-w-7xl bg-[#F5EFE6] px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="Loved across India" title="Best Sellers" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {best.map((p, i) => <Reveal key={p.id} delay={(i % 4) * 90}><ProductCard p={p} /></Reveal>)}
        </div>
      </section>

      {/* BRAND STORY — dark walnut */}
      <section className="wood-grain grain-overlay">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div className="float-glow pointer-events-none absolute -right-16 bottom-8 h-80 w-80 rounded-full bg-[#B08A57]/15 blur-3xl" />
          <Reveal scale className="relative">
            <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop" alt="Handcrafted furniture detail" loading="lazy" className="h-[440px] w-full rounded-2xl border border-white/10 object-cover shadow-2xl" />
          </Reveal>
          <Reveal className="relative text-[#FFF9F0]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D8B98A]">Our Craft</p>
            <h2 className="font-display mt-3 text-3xl sm:text-5xl">Crafted With Purpose</h2>
            <p className="mt-4 leading-relaxed text-[#FFF9F0]/75">Furniture designed around comfort, quality and timeless style. Seasoned timber, tested joinery and hand-checked finishes — pieces that serve your family for decades, not seasons.</p>
            <Link to="/about" className="btn-lux mt-8 inline-block rounded-lg border border-[#B08A57] px-8 py-3.5 text-sm font-bold text-[#D8B98A] hover:bg-[#B08A57] hover:text-[#2A1912]">Our Story</Link>
          </Reveal>
        </div>
      </section>

      {/* PROMO */}
      <section className="mx-auto max-w-7xl bg-[#EDE3D5] px-4 py-20 sm:px-6">
        <Reveal scale className="relative overflow-hidden rounded-3xl">
          <img src="https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=1800&auto=format&fit=crop" alt="Festive living space" loading="lazy" className="h-[380px] w-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-start justify-center bg-gradient-to-r from-[#2A1912]/80 via-[#2A1912]/40 to-transparent p-8 text-[#FFF9F0] sm:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D8B98A]">Festive Offer</p>
            <h2 className="font-display mt-2 text-3xl sm:text-5xl">Make Space for Better Living</h2>
            <p className="mt-3 max-w-md text-white/80">Selected furniture designed to transform everyday spaces. Up to 40% off.</p>
            <Link to="/shop" className="btn-lux mt-6 rounded-lg bg-[#FFF9F0] px-8 py-3.5 text-sm font-bold text-[#2A1912] hover:bg-[#B98252]">Shop Now</Link>
          </div>
        </Reveal>
      </section>

      {/* WHY */}
      <section className="mx-auto max-w-7xl bg-[#F5EFE6] px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Award, t: 'Premium Craftsmanship', d: 'Seasoned wood, tested joinery, 5-year warranty.' },
            { i: Ruler, t: 'Thoughtful Design', d: 'Proportioned for real Indian room sizes.' },
            { i: Truck, t: 'Reliable Delivery', d: 'Free delivery & installation across TN.' },
            { i: RefreshCcw, t: 'Easy Returns', d: '7-day hassle-free returns, no questions.' },
          ].map(({ i: I, t, d }, idx) => (
            <Reveal key={t} delay={idx * 90} className="rounded-2xl border border-[#DCCBB8]/60 bg-[#FFF9F0] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#2A1912]/10">
              <span className="inline-flex rounded-xl bg-[#3A2418] p-3 text-[#D8B98A]"><I size={22} /></span>
              <h3 className="mt-4 font-semibold text-[#241A15]">{t}</h3><p className="mt-1 text-sm text-stone-500">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="wood-grain-light border-y border-[#DCCBB8]/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHeading eyebrow="Reviews" title="Loved by Indian Homes" />
          <div className="grid gap-6 md:grid-cols-3">
            {REVIEWS.map((r, i) => (
              <Reveal key={r.id} delay={i * 110} className="rounded-2xl border border-[#DCCBB8]/60 bg-[#FFF9F0] p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <Stars value={r.rating} />
                <p className="mt-3 text-sm leading-relaxed text-stone-600">“{r.text}”</p>
                <p className="mt-4 text-sm font-bold text-[#241A15]">{r.name}</p><p className="text-xs text-[#8B5E3C]">{r.location}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-7xl bg-[#F5EFE6] px-4 py-20 sm:px-6">
        <Reveal scale className="wood-grain grain-overlay relative overflow-hidden rounded-3xl px-6 py-14 text-center text-[#FFF9F0] sm:px-12">
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl">Stay Inspired</h2>
            <p className="mx-auto mt-3 max-w-md text-[#FFF9F0]/70">Receive new collection updates, furniture inspiration and exclusive offers.</p>
            <form className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:items-center" onSubmit={e => { e.preventDefault(); alert('Subscribed! Welcome to HomeCraft.'); }}>
              <label htmlFor="nl-email" className="sr-only">Email address</label>
              <input id="nl-email" type="email" required placeholder="Email address"
                className="h-12 w-full min-w-0 flex-1 rounded-lg border border-white/25 bg-white/10 px-4 text-sm leading-normal text-white outline-none transition-colors duration-300 placeholder:text-white/50 focus:border-[#B98252] sm:w-auto" />
              <button className="btn-lux h-12 w-full shrink-0 whitespace-nowrap rounded-lg bg-[#B98252] px-7 text-sm font-bold leading-normal text-[#2A1912] transition-colors duration-300 hover:bg-[#FFF9F0] sm:w-auto">Subscribe</button>
            </form>
          </div>
        </Reveal>
      </section>

      <Footer />
      <QuickView /><SearchOverlay />
    </div>
  );
}

