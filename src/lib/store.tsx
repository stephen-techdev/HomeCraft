import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiFetch } from './api';
import { PRODUCTS } from './data';
import type { CartItem, Order, Product } from './types';

interface ShopState {
  cart: CartItem[]; wishlist: string[]; orders: Order[];
  searchOpen: boolean; quickViewId: string | null;
  addToCart: (id: string, qty?: number, size?: string, color?: string) => void;
  removeFromCart: (id: string) => void; setQty: (id: string, qty: number) => void; clearCart: () => void;
  toggleWishlist: (id: string) => void; moveToCart: (id: string) => void;
  placeOrder: (o: Omit<Order, 'id' | 'date' | 'status'>) => Order;
  setSearchOpen: (v: boolean) => void; setQuickViewId: (id: string | null) => void;
  cartCount: number;
  /** Bumps whenever server products merge into the catalogue. */
  catalogVersion: number; refreshCatalog: () => Promise<void>;
}

const Ctx = createContext<ShopState | null>(null);
const load = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fb; } catch { return fb; } };

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => load('hc-cart', []));
  const [wishlist, setWishlist] = useState<string[]>(() => load('hc-wishlist', []));
  const [orders, setOrders] = useState<Order[]>(() => load('hc-orders', []));
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('hc-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('hc-wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem('hc-orders', JSON.stringify(orders)); }, [orders]);

  const addToCart = useCallback((id: string, qty = 1, size?: string, color?: string) => {
    setCart(c => {
      const i = c.findIndex(x => x.productId === id && x.size === size && x.color === color);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], qty: n[i].qty + qty }; return n; }
      return [...c, { productId: id, qty, size, color }];
    });
  }, []);
  const removeFromCart = useCallback((id: string) => setCart(c => c.filter(x => x.productId !== id)), []);
  const setQty = useCallback((id: string, qty: number) => setCart(c => qty <= 0 ? c.filter(x => x.productId !== id) : c.map(x => x.productId === id ? { ...x, qty } : x)), []);
  const clearCart = useCallback(() => setCart([]), []);
  const toggleWishlist = useCallback((id: string) => setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]), []);
  const moveToCart = useCallback((id: string) => { addToCart(id); setWishlist(w => w.filter(x => x !== id)); }, [addToCart]);
  const placeOrder: ShopState['placeOrder'] = useCallback((o) => {
    const order: Order = { ...o, id: 'HC' + Date.now().toString().slice(-8), date: new Date().toISOString(), status: 'Confirmed' };
    setOrders(prev => [order, ...prev]); setCart([]);
    return order;
  }, []);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  // ---- shared catalogue: merge admin-managed server products into PRODUCTS ----
  // PRODUCTS (src/lib/data.ts) is the single source the whole shop reads.
  // Server rows are merged in (dedupe by id, server wins) so admin additions
  // appear in Shop / Collections / Product pages without a second product list.
  // Catalogue ids an admin deleted are reported by /api/products/removed and are
  // filtered out here, so a deleted product never comes back with the seed array.
  const [catalogVersion, setCatalogVersion] = useState(0);
  const refreshCatalog = useCallback(async () => {
    try {
      const [rows, removed] = await Promise.all([
        apiFetch<Product[]>('/api/products'),
        apiFetch<{ ids: string[] }>('/api/products/removed').catch(() => ({ ids: [] as string[] })),
      ]);
      const skip = new Set<string>([...rows.map(r => r.id), ...removed.ids]);
      const local = PRODUCTS.filter(p => !skip.has(p.id));
      PRODUCTS.length = 0;
      PRODUCTS.push(...rows, ...local);
      setCatalogVersion(v => v + 1);
    } catch { /* backend offline — static catalogue still works */ }
  }, []);
  useEffect(() => { refreshCatalog(); }, [refreshCatalog]);

  const value: ShopState = { cart, wishlist, orders, searchOpen, quickViewId, addToCart, removeFromCart, setQty, clearCart, toggleWishlist, moveToCart, placeOrder, setSearchOpen, setQuickViewId, cartCount, catalogVersion, refreshCatalog };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useShop outside provider');
  return v;
}

