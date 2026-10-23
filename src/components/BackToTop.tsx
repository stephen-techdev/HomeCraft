import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Floating "Back to Top" button — lives over the UI (bottom-right), appears
 *  after the page has been scrolled, and smooth-scrolls home. */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const f = () => setVisible(window.scrollY > 400);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      title="Back to top"
      className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#2A1912] text-[#D8B98A] shadow-xl shadow-[#2A1912]/30 transition-all duration-300 hover:-translate-y-1 hover:bg-[#8B5E3C] hover:text-[#FFF9F0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B08A57] ${
        visible ? 'opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <ArrowUp size={20} />
    </button>
  );
}
