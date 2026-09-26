export interface ProductVariant {
  id: string;
  colorName: string;
  colorValue: string;
  images: string[];
  /** Ordered frames for 360-style drag rotation; falls back to `images` */
  rotationImages?: string[];
  price?: number;
  stock?: number;
}
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  stock: number;
  images: string[];
  colors: string[];
  sizes: string[];
  featured?: boolean;
  newArrival?: boolean;
  /** Per-color variants — when present the gallery is variant-aware. */
  variants?: ProductVariant[];
  /** Optional ordered rotation frames; when absent `images` are used. */
  rotationImages?: string[];
  /** Collection slugs this product belongs to. Defaults to its category slug. */
  collections?: string[];
  /** Lowercase keywords for subcategory matching (e.g. 'sofa', 'tv'). */
  tags?: string[];
}

export interface Category { name: string; image: string; blurb: string }
export interface CartItem { productId: string; qty: number; size?: string; color?: string }
export interface CollectionSub { label: string; match: string }
export interface Collection {
  id: string; name: string; slug: string; description: string; image: string;
  subcategories: CollectionSub[];
}
export interface Order {
  id: string; date: string; items: CartItem[]; total: number; status: 'Pending'|'Confirmed'|'Packed'|'Shipped'|'Delivered'|'Cancelled';
  name: string; city: string;
}
export interface Review { id: string; name: string; location: string; rating: number; text: string }
