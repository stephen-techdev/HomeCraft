import { Heart, LogOut, Menu, Package, Search, Settings, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { firstName, useAuth } from '../lib/auth';
import { useShop } from '../lib/store';

type NavItem = { to: string; label: string; hash?: boolean };

/** `hash: true` items are in-page anchors (Categories / Collections) — they never
 *  get an active-route indicator, so no line is ever drawn under them. */
const LINKS: NavItem[] = [
  { to: '/', label: 'Home' }, { to: '/shop', label: 'Shop' },
  { to: '/#categories', label: 'Categories', hash: true },
  { to: '/#collections', label: 'Collections', hash: true },
  { to: '/about', label: 'About' }, { to: '/contact', label: 'Contact' },
];

const iconBtn = 'rounded-full p-2 text-[#241A15] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#EDE3D5] hover:text-[#8B5E3C]';
/* Nav items: colour-only interaction. No decorative underline at rest. */
const navIdle = 'text-[#241A15]/80 hover:text-[#8B5E3C]';
const navActive = 'font-semibold text-[#8B5E3C]';

export default function Navbar() {
  const { cartCount, wishlist, setSearchOpen } = useShop();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [bump, setBump] = useState(false);
  const first = useRef(true);
  const nav = useNavigate();

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [cartCount]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menu]);

  return (
    <header className={`sticky top-0 z-40 border-b border-[#8B5E3C]/20 bg-[#F5EFE6]/85 transition-all duration-300 ${scrolled ? 'py-1.5 shadow-lg shadow-[#2A1912]/10 backdrop-blur-xl' : 'py-3.5 backdrop-blur-md'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight text-[#241A15]" aria-label="HomeCraft home">
          Home<span className="text-[#8B5E3C]">Craft</span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {LINKS.map(l => l.hash ? (
            <Link key={l.label} to={l.to}
              className={`nav-link text-sm font-medium transition-colors duration-300 ${navIdle}`}>
              {l.label}
            </Link>
          ) : (
            <NavLink key={l.label} to={l.to}
              className={({ isActive }) => `nav-link text-sm font-medium transition-colors duration-300 ${isActive ? navActive : navIdle}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <button onClick={() => setSearchOpen(true)} className={iconBtn} aria-label="Search"><Search size={20} /></button>
          <button onClick={() => nav('/wishlist')} className={`${iconBtn} relative`} aria-label="Wishlist">
            <Heart size={20} />
            {wishlist.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#B08A57] text-[11px] font-bold text-white">{wishlist.length}</span>}
          </button>
          <button onClick={() => nav('/cart')} className={`${iconBtn} relative ${bump ? 'bump' : ''}`} aria-label="Cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2A1912] text-[11px] font-bold text-[#FFF9F0]">{cartCount}</span>}
          </button>
          {!user ? (
            <>
              <button onClick={() => nav('/login')} className="ml-1 hidden rounded-lg bg-[#2A1912] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#8B5E3C] sm:block">Login</button>
              <button onClick={() => nav('/login')} className={iconBtn} aria-label="Account"><User size={20} /></button>
            </>
          ) : (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setMenu(m => !m)} className="ml-1 flex items-center gap-2 rounded-full border border-[#DCCBB8] bg-white py-1 pl-1 pr-2.5 transition-all hover:border-[#8B5E3C]" aria-label="Account menu" aria-expanded={menu}>
                {user.profile_image
                  ? <img src={user.profile_image} alt="" className="h-7 w-7 rounded-full object-cover" />
                  : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2A1912] text-xs font-bold text-[#D8B98A]">{user.full_name?.[0] ?? '?'}</span>}
                <span className="hidden max-w-20 truncate text-sm font-semibold sm:block">{firstName(user)}</span>
              </button>
              {menu && (
                <div className="modal-in absolute right-0 top-11 w-52 overflow-hidden rounded-xl border border-[#DCCBB8] bg-white py-1.5 shadow-xl" role="menu">
                  <p className="px-4 py-2 text-xs text-stone-400">Signed in as<br /><b className="text-[#241A15]">{user.email}</b></p>
                  {[
                    { to: '/account', label: 'My Profile', icon: User },
                    { to: '/account', label: 'My Orders', icon: Package },
                    { to: '/wishlist', label: 'Wishlist', icon: Heart },
                    { to: '/account', label: 'Settings', icon: Settings },
                  ].map(({ to, label, icon: I }) => (
                    <button key={label} onClick={() => { setMenu(false); nav(to); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-[#F5EFE6]" role="menuitem">
                      <I size={16} className="text-[#8B5E3C]" /> {label}
                    </button>
                  ))}
                  <button onClick={() => { setMenu(false); logout(); nav('/'); }}
                    className="flex w-full items-center gap-2.5 border-t px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50" role="menuitem">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
          <button onClick={() => setOpen(!open)} className={`${iconBtn} lg:hidden`} aria-label="Menu" aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {open && (
        <nav className="drawer-in border-t border-[#8B5E3C]/15 bg-[#F5EFE6] px-4 py-3 lg:hidden" aria-label="Mobile">
          {([...LINKS, { to: user ? '/account' : '/login', label: user ? `Hi, ${firstName(user)}` : 'Login / Create Account' }] as NavItem[]).map(l => (
            l.hash ? (
              <Link key={l.label} to={l.to} onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#241A15]/80 transition-colors hover:bg-[#EDE3D5] hover:text-[#8B5E3C]">{l.label}</Link>
            ) : (
              <NavLink key={l.label} to={l.to} onClick={() => setOpen(false)}
                className={({ isActive }) => `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[#EDE3D5] hover:text-[#8B5E3C] ${isActive ? navActive : 'text-[#241A15]/80'}`}>{l.label}</NavLink>
            )
          ))}
        </nav>
      )}
    </header>
  );
}
