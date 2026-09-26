/**
 * HomeCraft public contact details — single source of truth used by the
 * footer Customer Care section and the Contact page.
 * Kept out of auth/admin/product/database logic on purpose.
 */
export const CONTACT = {
  /** Display + mailto target for the support email. */
  email: 'demo862k7@gmail.com',
  /** Phone exactly as shown to the visitor. */
  phoneDisplay: '9345125667',
  /** RFC 3966 tel link — opens the system dialer (mobile) / call app (desktop). */
  phoneTel: 'tel:+919345125667',
  /** WhatsApp deep link for +91 93451 25667. */
  whatsapp: 'https://wa.me/919345125667',
  /** Business location shown in the UI. */
  location: 'Salem, Tamil Nadu, India',
  /** Google Maps search URL for the exact location (opens in a new tab). */
  maps: 'https://www.google.com/maps/search/?api=1&query=Salem%2C%20Tamil%20Nadu%2C%20India',
} as const;
