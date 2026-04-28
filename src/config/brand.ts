export const brand = {
  name: "Menuly",
  tagline: "Multilingual QR Menus for Modern Restaurants",
  description:
    "All-in-one platform to create, translate, design and share digital QR menus for restaurants, cafes and bars. Custom subdomains, AI translations, beautiful templates and real-time analytics.",
  email: "hello@menuly.test",
  address: "Calle del Sabor, 12 · 03001 Alicante, Spain",
  social: {
    twitter: "https://twitter.com/menuly",
    instagram: "https://instagram.com/menuly",
    linkedin: "https://linkedin.com/company/menuly",
  },
  // Pool of available short subdomains the user can pick from
  shortDomains: [
    "menuly.app",
    "qrm.menuly.app",
    "qr1.menuly.app",
    "qr2.menuly.app",
    "qr3.menuly.app",
    "qrly.menuly.app",
    "menu.menuly.app",
  ],
} as const;

export type Brand = typeof brand;
