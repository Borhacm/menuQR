export const brand = {
  name: "Menuly",
  tagline: "Multilingual QR Menus for Modern Restaurants",
  description:
    "All-in-one platform to create, translate, design and share digital QR menus for restaurants, cafes and bars. Custom subdomains, AI translations, beautiful templates and real-time analytics.",
  parentUrl: "https://www.bocal.online",
  contactUrl: (locale: string) => `https://www.bocal.online/${locale === "en" ? "en" : "es"}/form`,
} as const;

export type Brand = typeof brand;
