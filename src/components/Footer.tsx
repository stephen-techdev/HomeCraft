import { AtSign, Globe, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONTACT } from '../lib/contact';

type Social = { icon: LucideIcon; label: string; href?: string; to?: string; blank?: boolean };

export default function Footer() {
  const col = 'text-sm font-semibold uppercase tracking-[0.2em] text-[#D8B98A]';
  const link = 'transition-colors hover:text-[#D8B98A]';

  // premium interactive contact row — pointer cursor, smooth colour/underline
  // transition, subtle icon lift, and a clear keyboard focus ring.
  const clink = 'group flex cursor-pointer items-start gap-2 rounded-md text-[#EDE3D5] transition-all duration-300 ease-out underline-offset-4 hover:text-[#D8B98A] hover:opacity-90 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B08A57]';
  const cicon = 'mt-0.5 shrink-0 text-[#B98252] transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:text-[#D8B98A]';

  const social: Social[] = [
    { icon: AtSign, label: 'Email HomeCraft', href: `mailto:${CONTACT.email}?subject=HomeCraft%20Enquiry` },
    { icon: Globe, label: 'HomeCraft website', to: '/' },
    { icon: Mail, label: 'Write to us', href: `mailto:${CONTACT.email}` },
    { icon: MessageCircle, label: 'Chat on WhatsApp', href: CONTACT.whatsapp, blank: true },
  ];
  const scls = 'rounded-full border border-white/15 p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B08A57] hover:bg-[#B08A57] hover:text-[#2A1912] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B08A57]';

  return (
    <footer className="wood-grain grain-overlay text-[#EDE3D5]">
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="font-display text-3xl font-semibold text-[#FFF9F0]">Home<span className="text-[#B98252]">Craft</span></p>
          <p className="mt-2 text-sm italic text-[#D8B98A]">Furniture Crafted for Better Living</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#EDE3D5]/75">Thoughtful design, honest materials and comfort built for Indian homes — from seasoned walnut to soft cream fabrics.</p>
          <div className="mt-5 flex gap-3">
            {social.map(({ icon: I, label, href, to, blank }) =>
              to ? (
                <Link key={label} to={to} aria-label={label} className={scls}><I size={17} /></Link>
              ) : (
                <a key={label} href={href} aria-label={label} className={scls}
                  {...(blank ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><I size={17} /></a>
              ))}
          </div>
        </div>
        <nav aria-label="Shop">
          <p className={col}>Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {['Living Room', 'Bedroom', 'Dining', 'Office', 'Decor'].map(c => (
              <li key={c}><Link to={`/shop?cat=${encodeURIComponent(c)}`} className={link}>{c}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className={col}>Company</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/about" className={link}>Our Story</Link></li>
            <li><Link to="/contact" className={link}>Contact</Link></li>
            <li><Link to="/account" className={link}>My Account</Link></li>
            <li><Link to="/admin" className={link}>Admin</Link></li>
          </ul>
        </nav>
        <div>
          <p className={col}>Customer Care</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={CONTACT.maps} target="_blank" rel="noopener noreferrer" className={clink}>
                <MapPin size={16} className={cicon} /> <span>{CONTACT.location}</span>
              </a>
            </li>
            <li>
              <a href={CONTACT.phoneTel} className={clink}>
                <Phone size={16} className={cicon} /> <span>{CONTACT.phoneDisplay}</span>
              </a>
            </li>
            <li>
              <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className={clink}>
                <MessageCircle size={16} className={cicon} /> <span>Chat on WhatsApp</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`} className={clink}>
                <Mail size={16} className={cicon} /> <span>{CONTACT.email}</span>
              </a>
            </li>
            <li className="text-[#EDE3D5]/70">Open daily · 10 AM – 9 PM</li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10 py-5 text-center text-xs text-[#EDE3D5]/60">© 2026 HomeCraft. Crafted for better living.</div>
    </footer>
  );
}
