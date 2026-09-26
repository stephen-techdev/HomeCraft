import type { Category, Collection, Product, Review } from './types';

const U = (id: string) => `https://images.unsplash.com/${id}?q=80&w=900&auto=format&fit=crop`;

/** Maps legacy category names to collection slugs (backend-ready). */
export const CATEGORY_SLUGS: Record<string, string> = {
  'Living Room': 'living-room', 'Bedroom': 'bedroom', 'Dining': 'dining',
  'Office': 'office', 'Outdoor': 'outdoor', 'Decor': 'decor',
};

export const COLLECTIONS: Collection[] = [
  { id: 'c1', name: 'Living Room', slug: 'living-room', description: 'Comfortable pieces for everyday living.', image: U('photo-1555041469-a586c61ea9bc'),
    subcategories: [{ label: 'Sofas', match: 'sofa' }, { label: 'Lounge Chairs', match: 'chair' }, { label: 'Coffee Tables', match: 'coffee' }, { label: 'TV Units', match: 'tv' }, { label: 'Side Tables', match: 'side table' }] },
  { id: 'c2', name: 'Bedroom', slug: 'bedroom', description: 'Restful furniture for deep, quiet sleep.', image: U('photo-1505691938895-1758d7feb511'),
    subcategories: [{ label: 'Beds', match: 'bed' }, { label: 'Bedside Tables', match: 'bedside' }, { label: 'Wardrobes', match: 'wardrobe' }, { label: 'Dressers', match: 'dresser' }, { label: 'Benches', match: 'bench' }] },
  { id: 'c3', name: 'Dining', slug: 'dining', description: 'Gather around tables built for long meals.', image: U('photo-1524758631624-e2822e304c36'),
    subcategories: [{ label: 'Dining Tables', match: 'table' }, { label: 'Dining Chairs', match: 'chair' }, { label: 'Bar Stools', match: 'bar' }, { label: 'Sideboards', match: 'sideboard' }, { label: 'Storage', match: 'storage' }] },
  { id: 'c4', name: 'Home Office', slug: 'office', description: 'Focused workspaces with ergonomic comfort.', image: U('photo-1524758631624-e2822e304c36'),
    subcategories: [{ label: 'Office Desks', match: 'desk' }, { label: 'Office Chairs', match: 'chair' }, { label: 'Bookshelves', match: 'bookshelf' }, { label: 'Cabinets', match: 'cabinet' }, { label: 'Study Tables', match: 'study' }] },
  { id: 'c5', name: 'Outdoor', slug: 'outdoor', description: 'Weather-ready pieces for balconies and patios.', image: U('photo-1600210492486-724fe5c67fb0'),
    subcategories: [{ label: 'Outdoor Sofas', match: 'sofa' }, { label: 'Patio Chairs', match: 'patio' }, { label: 'Garden Tables', match: 'garden' }, { label: 'Balcony Furniture', match: 'balcony' }, { label: 'Storage', match: 'storage' }] },
  { id: 'c6', name: 'Decor', slug: 'decor', description: 'Light, texture and finishing touches.', image: U('photo-1586023492125-27b2c045efd7'),
    subcategories: [{ label: 'Table Lamps', match: 'lamp' }, { label: 'Floor Lamps', match: 'floor' }, { label: 'Mirrors', match: 'mirror' }, { label: 'Rugs', match: 'rug' }, { label: 'Vases', match: 'vase' }, { label: 'Wall Decor', match: 'wall' }] },
  { id: 'c7', name: 'Storage', slug: 'storage', description: 'Beautiful order for every room.', image: U('photo-1533090481720-856c6e3c1fdc'),
    subcategories: [{ label: 'Bookshelves', match: 'bookshelf' }, { label: 'Cabinets', match: 'cabinet' }, { label: 'Console Tables', match: 'console' }, { label: 'Shoe Cabinets', match: 'shoe' }, { label: 'Benches', match: 'bench' }] },
  { id: 'c8', name: 'Kids & Teens', slug: 'kids', description: 'Sturdy, safe and fun furniture for young rooms.', image: U('photo-1586023492125-27b2c045efd7'),
    subcategories: [{ label: 'Kids Beds', match: 'bed' }, { label: 'Study Desks', match: 'desk' }, { label: 'Kids Chairs', match: 'chair' }, { label: 'Toy Storage', match: 'toy' }, { label: 'Shelving', match: 'shelf' }] },
  { id: 'c9', name: 'Entryway', slug: 'entryway', description: 'First impressions, organised beautifully.', image: U('photo-1616486338812-3dadae4b4ace'),
    subcategories: [{ label: 'Console Tables', match: 'console' }, { label: 'Shoe Storage', match: 'shoe' }, { label: 'Entry Benches', match: 'bench' }, { label: 'Coat Racks', match: 'coat' }, { label: 'Mirrors', match: 'mirror' }] },
  { id: 'c10', name: 'Premium Collection', slug: 'premium', description: 'Statement pieces in solid wood, leather and brass.', image: U('photo-1618221195710-dd6b41faaea6'),
    subcategories: [{ label: 'Luxury Sofas', match: 'sofa' }, { label: 'Designer Chairs', match: 'chair' }, { label: 'Solid Wood Tables', match: 'table' }, { label: 'Statement Beds', match: 'bed' }, { label: 'Premium Cabinets', match: 'cabinet' }] },
];

export const getCollection = (slug: string | null | undefined): Collection | undefined =>
  COLLECTIONS.find(c => c.slug === slug);

/** Collections for a product (explicit, else derived from its category). */
export const productCollections = (p: Product): string[] =>
  p.collections ?? [CATEGORY_SLUGS[p.category] ?? p.category];

/** True when a product matches a subcategory keyword. */
export const matchesSub = (p: Product, match: string): boolean =>
  `${p.name} ${(p.tags ?? []).join(' ')}`.toLowerCase().includes(match.toLowerCase());

export const productsInCollection = (slug: string): Product[] =>
  PRODUCTS.filter(p => productCollections(p).includes(slug));

export const CATEGORIES: Category[] = [
  { name: 'Living Room', image: U('photo-1555041469-a586c61ea9bc'), blurb: 'Sofas, loungers & coffee tables' },
  { name: 'Bedroom', image: U('photo-1505691938895-1758d7feb511'), blurb: 'Beds, wardrobes & nightstands' },
  { name: 'Dining', image: U('photo-1524758631624-e2822e304c36'), blurb: 'Tables, chairs & storage' },
  { name: 'Office', image: U('photo-1524758631624-e2822e304c36'), blurb: 'Desks, ergonomic chairs & shelves' },
  { name: 'Outdoor', image: U('photo-1600210492486-724fe5c67fb0'), blurb: 'Balcony & patio seating' },
  { name: 'Decor', image: U('photo-1586023492125-27b2c045efd7'), blurb: 'Lamps, ottomans & accents' },
];

export const PRODUCTS: Product[] = [
  { id: 'classic-fabric-sofa', name: 'Classic Fabric Sofa', category: 'Living Room', description: 'A timeless three-seater in breathable weave with solid hardwood frame and deep, supportive cushions.', price: 45999, oldPrice: 64999, rating: 4.8, reviews: 412, stock: 14, images: [U('photo-1555041469-a586c61ea9bc')], colors: ['#c9b18c', '#6b5d4f', '#2b2118'], sizes: ['2-Seater', '3-Seater', 'L-Shape'], featured: true },
  { id: 'modern-lounge-chair', name: 'Modern Lounge Chair', category: 'Living Room', description: 'Sculpted lounge chair with walnut legs and premium cushioning for long, relaxed evenings.', price: 12999, oldPrice: 18999, rating: 4.7, reviews: 268, stock: 22, images: [U('photo-1592078615290-033ee584e267')], colors: ['#7d9b76', '#c9b18c', '#2b2118'], sizes: ['Standard'], featured: true, newArrival: true },
  { id: 'oak-dining-table', name: 'Oak Dining Table', category: 'Dining', description: 'Solid oak six-seater with a honed matte finish that ages beautifully with everyday use.', price: 34999, oldPrice: 49999, rating: 4.9, reviews: 190, stock: 8, images: [U('photo-1533090481720-856c6e3c1fdc')], colors: ['#9a6b3f', '#5b3d22'], sizes: ['4-Seater', '6-Seater'], featured: true },
  { id: 'minimal-bed-frame', name: 'Minimal Bed Frame', category: 'Bedroom', description: 'Low-profile queen bed with under-bed storage and a silent, squeak-free slatted base.', price: 52999, oldPrice: 74999, rating: 4.8, reviews: 324, stock: 6, images: [U('photo-1505691938895-1758d7feb511')], colors: ['#c9b18c', '#4a3421'], sizes: ['Queen', 'King'], featured: true, newArrival: true },
  { id: 'executive-office-chair', name: 'Executive Office Chair', category: 'Office', description: 'Ergonomic high-back chair with lumbar support, breathable mesh and 4D armrests.', price: 14999, oldPrice: 21999, rating: 4.6, reviews: 512, stock: 30, images: [U('photo-1592078615290-033ee584e267')], colors: ['#2b2118', '#6b5d4f'], sizes: ['Standard'], featured: true },
  { id: 'wooden-side-table', name: 'Wooden Side Table', category: 'Living Room', description: 'Compact solid-wood side table — perfect beside sofas, beds and reading chairs.', price: 4999, oldPrice: 7499, rating: 4.5, reviews: 143, stock: 40, images: [U('photo-1533090481720-856c6e3c1fdc')], colors: ['#9a6b3f'], sizes: ['Standard'] },
  { id: 'modern-bookshelf', name: 'Modern Bookshelf', category: 'Office', description: 'Five-tier open shelf in engineered wood with a warm oak veneer and anti-tip kit.', price: 11999, oldPrice: 16999, rating: 4.6, reviews: 98, stock: 17, images: [U('photo-1524758631624-e2822e304c36')], colors: ['#9a6b3f', '#2b2118'], sizes: ['5-Tier'], newArrival: true },
  { id: 'luxury-coffee-table', name: 'Luxury Coffee Table', category: 'Living Room', description: 'Stone-top coffee table with brass inlay and a sculptural wooden base.', price: 18999, oldPrice: 26999, rating: 4.7, reviews: 76, stock: 11, images: [U('photo-1533090481720-856c6e3c1fdc')], colors: ['#c9b18c', '#2b2118'], sizes: ['Standard'], newArrival: true },
  { id: 'reading-armchair', name: 'Reading Armchair', category: 'Bedroom', description: 'Cozy high-back armchair with ottoman pairing, ideal for corners and libraries.', price: 9999, oldPrice: 14999, rating: 4.5, reviews: 201, stock: 19, images: [U('photo-1493663284031-b7e3aefcae8e')], colors: ['#b76e79', '#7d9b76'], sizes: ['Standard'] },
  { id: 'brass-floor-lamp', name: 'Brass Floor Lamp', category: 'Decor', description: 'Warm 2700K floor lamp with linen shade and solid brass stem.', price: 3499, oldPrice: 5999, rating: 4.4, reviews: 167, stock: 52, images: [U('photo-1507473885765-e6ed057f782c')], colors: ['#f5ead6', '#2b2118'], sizes: ['Standard'] },
  { id: 'velvet-ottoman', name: 'Velvet Ottoman Pouf', category: 'Decor', description: 'Plush velvet pouf that doubles as extra seating or a footrest.', price: 2999, oldPrice: 4999, rating: 4.6, reviews: 233, stock: 64, images: [U('photo-1586023492125-27b2c045efd7')], colors: ['#b76e79', '#7d9b76', '#2b2118'], sizes: ['Standard'] },
  { id: 'patio-lounge-set', name: 'Patio Lounge Set', category: 'Outdoor', description: 'Weather-resistant two-seat balcony set with washable cushions.', price: 24999, oldPrice: 34999, rating: 4.5, reviews: 84, stock: 9, images: [U('photo-1600210492486-724fe5c67fb0')], colors: ['#7d9b76', '#2b2118'], sizes: ['2-Seater'], tags: ['patio', 'sofa', 'outdoor'] },
  { id: 'walnut-tv-unit', name: 'Walnut TV Unit', category: 'Living Room', description: 'Low-profile TV console in American walnut with cable management and soft-close shutters.', price: 24999, oldPrice: 34999, rating: 4.6, reviews: 132, stock: 12, images: [U('photo-1533090481720-856c6e3c1fdc')], colors: ['#4a2c14', '#9a6b3f'], sizes: ['5 ft', '6 ft'], collections: ['living-room'], tags: ['tv', 'tv-unit', 'storage'] },
  { id: 'oak-dresser-mirror', name: 'Oak Dresser with Mirror', category: 'Bedroom', description: 'Six-drawer dresser in white oak with an arched mirror and brass knobs.', price: 21999, oldPrice: 29999, rating: 4.7, reviews: 88, stock: 7, images: [U('photo-1618221195710-dd6b41faaea6')], colors: ['#c9b18c', '#4a3421'], sizes: ['Standard'], collections: ['bedroom'], tags: ['dresser', 'mirror'] },
  { id: 'teak-wardrobe', name: 'Teak Wardrobe', category: 'Bedroom', description: 'Three-door solid teak wardrobe with full-length mirror and lockable drawer.', price: 39999, oldPrice: 54999, rating: 4.8, reviews: 64, stock: 5, images: [U('photo-1615873968403-89e068629265')], colors: ['#6b4423', '#4a2c14'], sizes: ['3-Door'], collections: ['bedroom'], tags: ['wardrobe', 'storage'] },
  { id: 'oak-bedside-table', name: 'Oak Bedside Table', category: 'Bedroom', description: 'Compact bedside table with a drawer and open shelf for books and lamps.', price: 5999, oldPrice: 8999, rating: 4.5, reviews: 210, stock: 34, images: [U('photo-1533090481720-856c6e3c1fdc')], colors: ['#9a6b3f'], sizes: ['Standard'], collections: ['bedroom'], tags: ['bedside', 'side table'] },
  { id: 'upholstered-bedroom-bench', name: 'Upholstered Bedroom Bench', category: 'Bedroom', description: 'Tufted end-of-bed bench in linen with solid wood legs.', price: 8999, oldPrice: 12999, rating: 4.6, reviews: 97, stock: 15, images: [U('photo-1586023492125-27b2c045efd7')], colors: ['#c9b18c', '#6b5d4f'], sizes: ['Standard'], collections: ['bedroom'], tags: ['bench'] },
  { id: 'teak-bar-stool-2', name: 'Teak Bar Stool (Set of 2)', category: 'Dining', description: 'Counter-height bar stools in solid teak with footrests and leather seats.', price: 9999, oldPrice: 14999, rating: 4.5, reviews: 143, stock: 26, images: [U('photo-1592078615290-033ee584e267')], colors: ['#6b4423', '#2b2118'], sizes: ['Set of 2'], collections: ['dining'], tags: ['bar', 'chair', 'stool'] },
  { id: 'mango-sideboard', name: 'Mango Wood Sideboard', category: 'Dining', description: 'Four-door sideboard in mango wood — crockery storage with showcase charm.', price: 27999, oldPrice: 38999, rating: 4.7, reviews: 71, stock: 8, images: [U('photo-1524758631624-e2822e304c36')], colors: ['#9a6b3f', '#5b3d22'], sizes: ['Standard'], collections: ['dining', 'storage'], tags: ['sideboard', 'storage', 'cabinet'] },
  { id: 'oak-storage-cabinet', name: 'Oak Storage Cabinet', category: 'Office', description: 'Tall cabinet with adjustable shelves for files, books and supplies.', price: 15999, oldPrice: 21999, rating: 4.6, reviews: 83, stock: 13, images: [U('photo-1533090481720-856c6e3c1fdc')], colors: ['#9a6b3f', '#2b2118'], sizes: ['Standard'], collections: ['office', 'storage'], tags: ['cabinet', 'storage'] },
  { id: 'pine-bookshelf', name: 'Pine Bookshelf', category: 'Office', description: 'Six-tier solid pine bookshelf with a warm honey finish.', price: 8999, oldPrice: 12999, rating: 4.5, reviews: 156, stock: 21, images: [U('photo-1524758631624-e2822e304c36')], colors: ['#c9a06a', '#6b4423'], sizes: ['6-Tier'], collections: ['storage', 'office', 'kids'], tags: ['bookshelf', 'shelf', 'storage'] },
  { id: 'entryway-shoe-cabinet', name: 'Entryway Shoe Cabinet', category: 'Decor', description: 'Slim shoe cabinet for 12 pairs with a sit-and-wear cushioned top.', price: 10999, oldPrice: 15499, rating: 4.6, reviews: 118, stock: 18, images: [U('photo-1600585154340-be6161a56a0c')], colors: ['#9a6b3f', '#2b2118'], sizes: ['Standard'], collections: ['storage', 'entryway'], tags: ['shoe', 'storage', 'cabinet'] },
  { id: 'oak-console-table', name: 'Oak Console Table', category: 'Decor', description: 'Narrow console for entryways and living rooms with two drawers.', price: 12999, oldPrice: 17999, rating: 4.7, reviews: 92, stock: 14, images: [U('photo-1533090481720-856c6e3c1fdc')], colors: ['#9a6b3f'], sizes: ['Standard'], collections: ['entryway', 'storage', 'living-room'], tags: ['console', 'side table'] },
  { id: 'brass-coat-rack', name: 'Brass Coat Rack', category: 'Decor', description: 'Freestanding coat rack in solid brass with marble base.', price: 3999, oldPrice: 5999, rating: 4.4, reviews: 76, stock: 29, images: [U('photo-1507473885765-e6ed057f782c')], colors: ['#d9a45b', '#2b2118'], sizes: ['Standard'], collections: ['entryway'], tags: ['coat'] },
  { id: 'round-wall-mirror', name: 'Round Wall Mirror', category: 'Decor', description: '36-inch round mirror with a solid oak frame and brass hanging rail.', price: 4999, oldPrice: 7999, rating: 4.6, reviews: 189, stock: 37, images: [U('photo-1618221195710-dd6b41faaea6')], colors: ['#c9b18c'], sizes: ['36 inch'], collections: ['decor', 'entryway'], tags: ['mirror', 'wall'] },
  { id: 'ceramic-vase-set', name: 'Ceramic Vase Set', category: 'Decor', description: 'Set of three hand-glazed ceramic vases in earthy tones.', price: 1999, oldPrice: 3499, rating: 4.5, reviews: 240, stock: 58, images: [U('photo-1586023492125-27b2c045efd7')], colors: ['#b76e79', '#7d9b76', '#c9b18c'], sizes: ['Set of 3'], collections: ['decor'], tags: ['vase'] },
  { id: 'wool-area-rug', name: 'Wool Area Rug', category: 'Decor', description: 'Hand-tufted 5x7 wool rug in warm beige with a subtle border.', price: 7999, oldPrice: 11999, rating: 4.7, reviews: 134, stock: 24, images: [U('photo-1600210492486-724fe5c67fb0')], colors: ['#dccbb8', '#8b5e3c'], sizes: ['5x7 ft'], collections: ['decor'], tags: ['rug'] },
  { id: 'kids-pine-bed', name: 'Kids Pine Bed', category: 'Bedroom', description: 'Sturdy single bed in solid pine with guard rail and storage drawers.', price: 18999, oldPrice: 26999, rating: 4.8, reviews: 59, stock: 9, images: [U('photo-1505691938895-1758d7feb511')], colors: ['#c9a06a', '#7d9b76'], sizes: ['Single'], collections: ['kids', 'bedroom'], tags: ['bed', 'kids'] },
  { id: 'kids-study-desk', name: 'Kids Study Desk', category: 'Office', description: 'Height-friendly study desk with hutch shelves and cable slot.', price: 8999, oldPrice: 12999, rating: 4.6, reviews: 87, stock: 16, images: [U('photo-1524758631624-e2822e304c36')], colors: ['#c9a06a', '#2b2118'], sizes: ['Standard'], collections: ['kids', 'office'], tags: ['desk', 'study', 'kids'] },
  { id: 'toy-storage-chest', name: 'Toy Storage Chest', category: 'Decor', description: 'Soft-close toy chest in engineered wood with playful rounded edges.', price: 4999, oldPrice: 7499, rating: 4.5, reviews: 112, stock: 22, images: [U('photo-1533090481720-856c6e3c1fdc')], colors: ['#7d9b76', '#c9b18c'], sizes: ['Standard'], collections: ['kids', 'storage'], tags: ['toy', 'storage'] },
  { id: 'teak-garden-table', name: 'Teak Garden Table', category: 'Outdoor', description: 'Foldable four-seater garden table in plantation teak.', price: 17999, oldPrice: 24999, rating: 4.6, reviews: 66, stock: 10, images: [U('photo-1600210492486-724fe5c67fb0')], colors: ['#6b4423'], sizes: ['4-Seater'], collections: ['outdoor'], tags: ['garden', 'table', 'outdoor'] },
  { id: 'balcony-lounge-chair', name: 'Balcony Lounge Chair', category: 'Outdoor', description: 'Compact lounge chair with weatherproof rope weave and cushion.', price: 8999, oldPrice: 12999, rating: 4.5, reviews: 104, stock: 17, images: [U('photo-1592078615290-033ee584e267')], colors: ['#7d9b76', '#2b2118'], sizes: ['Standard'], collections: ['outdoor'], tags: ['balcony', 'chair', 'patio'] },
  { id: 'chesterfield-luxury-sofa', name: 'Chesterfield Luxury Sofa', category: 'Living Room', description: 'Deep-buttoned chesterfield in full-grain leather with brass castors.', price: 89999, oldPrice: 129999, rating: 4.9, reviews: 41, stock: 4, images: [U('photo-1555041469-a586c61ea9bc')], colors: ['#4a2c14', '#2b2118'], sizes: ['3-Seater'], featured: true, collections: ['premium', 'living-room'], tags: ['sofa', 'luxury'] },
  { id: 'designer-accent-chair', name: 'Designer Accent Chair', category: 'Living Room', description: 'Sculptural accent chair with boucle upholstery and walnut frame.', price: 24999, oldPrice: 35999, rating: 4.8, reviews: 73, stock: 11, images: [U('photo-1493663284031-b7e3aefcae8e')], colors: ['#ede3d5', '#8b5e3c'], sizes: ['Standard'], collections: ['premium', 'living-room'], tags: ['chair', 'designer'] },
  { id: 'canopy-statement-bed', name: 'Canopy Statement Bed', category: 'Bedroom', description: 'Four-poster canopy bed in solid rosewood with upholstered headboard.', price: 79999, oldPrice: 109999, rating: 4.9, reviews: 33, stock: 3, images: [U('photo-1505691938895-1758d7feb511')], colors: ['#3a2418'], sizes: ['King'], collections: ['premium', 'bedroom'], tags: ['bed', 'statement'] },
  { id: 'rosewood-premium-cabinet', name: 'Rosewood Premium Cabinet', category: 'Office', description: 'Heirloom-grade rosewood cabinet with hand-carved panels.', price: 45999, oldPrice: 64999, rating: 4.8, reviews: 28, stock: 5, images: [U('photo-1524758631624-e2822e304c36')], colors: ['#3a2418'], sizes: ['Standard'], collections: ['premium', 'storage'], tags: ['cabinet', 'premium', 'storage'] },
  { id: 'linen-storage-bench', name: 'Linen Storage Bench', category: 'Decor', description: 'Entryway bench with hidden storage and a washable linen cushion.', price: 7999, oldPrice: 11499, rating: 4.6, reviews: 95, stock: 19, images: [U('photo-1586023492125-27b2c045efd7')], colors: ['#ede3d5', '#8b5e3c'], sizes: ['Standard'], collections: ['storage', 'entryway', 'bedroom'], tags: ['bench', 'storage'] },
  { id: 'kids-activity-chair', name: 'Kids Activity Chair', category: 'Decor', description: 'Lightweight, tip-resistant chair sized for young artists and readers.', price: 3499, oldPrice: 4999, rating: 4.6, reviews: 141, stock: 31, images: [U('photo-1592078615290-033ee584e267')], colors: ['#7d9b76', '#b98252'], sizes: ['Standard'], collections: ['kids'], tags: ['chair', 'kids'] },
  { id: 'outdoor-storage-box', name: 'Outdoor Storage Box', category: 'Outdoor', description: 'Weatherproof deck box for cushions and garden tools with lockable lid.', price: 6999, oldPrice: 9999, rating: 4.5, reviews: 78, stock: 20, images: [U('photo-1600210492486-724fe5c67fb0')], colors: ['#6b5d4f', '#2b2118'], sizes: ['120 L'], collections: ['outdoor', 'storage'], tags: ['storage', 'outdoor', 'box'] },
];

/* ---- variant synthesis: keep variant data centralized (spec Part 2) ---- */
const HEX_NAME: Record<string, string> = {
  '#c9b18c': 'Walnut', '#6b5d4f': 'Taupe', '#2b2118': 'Espresso', '#7d9b76': 'Sage',
  '#9a6b3f': 'Oak', '#5b3d22': 'Cocoa', '#4a3421': 'Mocha', '#b76e79': 'Blush',
  '#f5ead6': 'Cream', '#d9a45b': 'Brass', '#c9a06a': 'Honey', '#6b4423': 'Teak',
  '#4a2c14': 'Mahogany', '#ede3d5': 'Ivory', '#8b5e3c': 'Chestnut', '#b98252': 'Caramel',
  '#3a2418': 'Rosewood', '#dccbb8': 'Sand',
};
// per-color rotation: SAME product shape, different color variant — do NOT switch to unrelated product images
for (const p of PRODUCTS) {
  if (!p.variants || p.variants.length === 0) {
    const base = p.images[0];
    // use 6 frames for showcase products, 3 for others; all frames are same product from different angles
    const frameCount = p.id.includes('sofa') || p.id.includes('chair') || p.id.includes('bed') || p.id.includes('table') ? 6 : 4;
    p.variants = p.colors.map((hex, i) => ({
      id: `${p.id}__${i}`,
      colorName: HEX_NAME[hex.toLowerCase()] ?? hex,
      colorValue: hex,
      // keep SAME sofa/chair image across colors — color is the variant, not the shape
      images: [base],
      // rotation frames are SAME product viewed from successive angles; for demo they reuse the base image
      // (admin can upload distinct per-variant angles); distinct URLs prevent cache dedup
      rotationImages: Array.from({ length: frameCount }, () => base),
      stock: Math.max(1, p.stock - i),
    }));
  }
  if (!p.rotationImages && p.images.length > 1) p.rotationImages = p.images;
}

export const REVIEWS: Review[] = [
  { id: 'r1', name: 'Priya Raghavan', location: 'Chennai', rating: 5, text: 'The sofa quality is outstanding — sturdy frame, beautiful weave, and delivery was on time with installation.' },
  { id: 'r2', name: 'Karthik Menon', location: 'Coimbatore', rating: 5, text: 'Our dining table transformed the room. Finish is premium and the support team was very courteous.' },
  { id: 'r3', name: 'Aisha Khan', location: 'Bengaluru', rating: 4, text: 'Elegant designs and honest pricing. The bed frame feels rock solid with zero noise.' },
];

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN');
export const discountPct = (p: Product) => p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
