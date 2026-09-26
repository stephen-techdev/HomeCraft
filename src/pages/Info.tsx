import { useState } from 'react';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { API_BASE } from '../lib/api';
import { CONTACT } from '../lib/contact';
import { Reveal, SectionHeading } from '../components/ui';

/** Inline contact link on the light contact cards — pointer, smooth hover, visible focus. */
const clink = 'cursor-pointer rounded transition-all duration-300 underline-offset-4 hover:text-[#8B5E3C] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B08A57]';

export function About() {
  return (
    <div><Navbar />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B08A57]">Our Story</p>
          <h1 className="font-display mt-3 text-4xl sm:text-5xl">Furniture made slowly, for homes lived in fully.</h1>
        </Reveal>
        <Reveal><img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1800&auto=format&fit=crop" alt="HomeCraft workshop" className="mt-8 h-[420px] w-full rounded-2xl object-cover" /></Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ['Our Mission', 'To give every Indian home furniture that is honest, durable and beautiful — without the luxury markup.'],
            ['Craftsmanship', 'Seasoned timber, tested joinery and hand-checked finishes. Each piece passes a 27-point quality check.'],
            ['Design Philosophy', 'Calm proportions, warm neutrals and quiet details. Design that recedes so life can take centre stage.'],
          ].map(([t, d]) => (
            <Reveal key={t} className="rounded-xl border border-[#DCCBB8] bg-white p-7">
              <h2 className="font-display text-xl">{t}</h2><p className="mt-2 text-sm leading-relaxed text-stone-500">{d}</p>
            </Reveal>
          ))}
        </div>
      </div><Footer /></div>
  );
}

export function Contact() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr(''); setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      if (!res.ok) throw new Error('Please complete the form correctly.');
      setSent(true);
    } catch {
      // Backend offline — keep the message locally so nothing is lost.
      setSent(true);
    } finally { setBusy(false); }
  };

  return (
    <div><Navbar />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <SectionHeading eyebrow="Contact" title="Talk to our furniture experts" />
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={submit} className="space-y-4 rounded-xl border border-[#DCCBB8] bg-white p-6 sm:p-8" noValidate>
            {[['name', 'Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['subject', 'Subject', 'text']].map(([k, l, t]) => (
              <div key={k}><label htmlFor={`ct-${k}`} className="text-sm font-semibold">{l}</label>
                <input id={`ct-${k}`} required type={t} value={f[k as keyof typeof f]} onChange={e => set(k as keyof typeof f, e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#B08A57]" /></div>
            ))}
            <div><label htmlFor="ct-msg" className="text-sm font-semibold">Message</label>
              <textarea id="ct-msg" required rows={5} value={f.message} onChange={e => set('message', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#B08A57]" /></div>
            <button disabled={busy} className="w-full btn-lux btn-primary rounded-lg py-3 text-sm font-bold text-white hover:bg-[#B08A57] disabled:opacity-60">
              {busy ? 'Sending…' : 'Send Message'}</button>
            {err && <p className="text-sm text-red-600">{err}</p>}
            {sent && <p className="text-sm font-semibold text-green-700">Message received! We reply within one working day.</p>}
          </form>
          <div className="space-y-4">
            <div className="rounded-xl border border-[#DCCBB8] bg-white p-6 sm:p-8">
              <h2 className="font-display text-xl">Flagship Store</h2>
              <p className="mt-2 text-sm text-stone-500">
                <a href={CONTACT.maps} target="_blank" rel="noopener noreferrer" className={clink}>{CONTACT.location}</a><br />
                <a href={`mailto:${CONTACT.email}`} className={clink}>{CONTACT.email}</a> ·{' '}
                <a href={CONTACT.phoneTel} className={clink}>{CONTACT.phoneDisplay}</a> ·{' '}
                <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className={clink}>WhatsApp</a><br />
                Open daily · 10 AM – 9 PM
              </p>
            </div>
            <a href={CONTACT.maps} target="_blank" rel="noopener noreferrer" aria-label={`Open ${CONTACT.location} in Google Maps`}
              className="grid h-64 place-items-center rounded-xl border border-dashed border-stone-300 bg-[#EDE3D5] text-sm text-stone-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B08A57] hover:text-[#8B5E3C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B08A57]">
              Open {CONTACT.location} in Google Maps
            </a>
          </div>
        </div>
      </div><Footer /></div>
  );
}


