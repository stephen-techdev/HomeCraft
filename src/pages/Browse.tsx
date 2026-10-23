import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import QuickView from '../components/QuickView';
import SearchOverlay from '../components/SearchOverlay';
import { Reveal } from '../components/ui';
import { COLLECTIONS, productsInCollection } from '../lib/data';

function BrowseHero({ eyebrow, title, sub, crumb }: { eyebrow: string; title: string; sub: string; crumb: string }) {
  return (
    <section className="relative overflow-hidden bg-[#2A1912]">
      <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2000&auto=format&fit=crop"
        alt="" className="h-64 w-full object-cover sm:h-72" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#2A1912]/90 via-[#2A1912]/55 to-transparent" />
      <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-center px-4 text-[#FFF9F0] sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D8B98A]">
          <Link to="/" className="hover:underline">Home</Link> / {crumb}
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D8B98A]">{eyebrow}</p>
        <h1 className="font-display mt-2 text-4xl uppercase sm:text-5xl">{title}</h1>
        <p className="mt-2 max-w-md text-[#FFF9F0]/80">{sub}</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F5EFE6] to-transparent" />
    </section>
  );
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Half-transparent stripe card — warm paper look. */
function BrowseCard({ to, image, title, sub, count, delay }: {
  to: string; image: string; title: string; sub: string; count: number; delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <Link to={to} onClick={scrollToTop}
        className="group relative block overflow-hidden rounded-2xl border border-[#DCCBB8]/50 bg-[#FFF9F0] shadow-lg shadow-[#2A1912]/10 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#2A1912]/25">
        <img src={image} alt={title} loading="lazy"
          className="h-52 w-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-105" />
        <div className="p-5">
          <h3 className="font-display text-xl text-[#241A15]">{title}</h3>
          <p className="mt-1 text-sm text-stone-500">{sub}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#8B5E3C] transition-transform duration-300 group-hover:translate-x-1">
            {count} product{count !== 1 && 's'} <ArrowRight size={15} />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

export default function CollectionsPage() {
  return (
    <div>
      <Navbar />
      <BrowseHero
        eyebrow="The Catalog"
        title="Browse Collections"
        sub="Ten curated collections — from everyday living to statement luxury."
        crumb="Collections"
      />
      <section className="mx-auto max-w-7xl bg-[#F5EFE6] px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((c, i) => (
            <BrowseCard
              key={c.slug}
              to={`/shop?collection=${encodeURIComponent(c.slug)}`}
              image={c.image}
              title={c.name}
              sub={c.description}
              count={productsInCollection(c.slug).length}
              delay={(i % 3) * 90}
            />
          ))}
        </div>
      </section>
      <Footer /><QuickView /><SearchOverlay />
    </div>
  );
}
