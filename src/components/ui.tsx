import { useEffect, useRef, type ReactNode } from 'react';

export function Reveal({ children, className = '', delay = 0, scale = false }: { children: ReactNode; className?: string; delay?: number; scale?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { el.classList.add('visible'); io.disconnect(); } }), { threshold: 0.1 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`${scale ? 'reveal-scale' : 'reveal'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

export function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <Reveal className="mx-auto mb-10 max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B08A57]">{eyebrow}</p>
      <h2 className="font-display mt-3 text-3xl font-medium sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-stone-500">{sub}</p>}
    </Reveal>
  );
}

export function Stars({ value, className = '' }: { value: number; className?: string }) {
  return <span className={`text-sm font-semibold text-[#B08A57] ${className}`} aria-label={`${value} out of 5 stars`}>★ {value.toFixed(1)}</span>;
}

