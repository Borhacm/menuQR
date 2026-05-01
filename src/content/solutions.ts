export interface SolutionPage {
  slug: string;
  title: string;
  hero: string;
  description: string;
  bullets: string[];
  iconKey:
    | "domain"
    | "management"
    | "analytics"
    | "templates"
    | "multilingual"
    | "media"
    | "currency"
    | "qr";
}

export const SOLUTIONS: SolutionPage[] = [
  {
    slug: "personalized-domain",
    title: "Personalized QR menu domain",
    hero: "A short, memorable subdomain for your restaurant",
    description:
      "Pick from a curated set of short root domains and combine them with your brand to create a personal web address for your QR menu. Pro plans can also connect a custom CNAME domain.",
    bullets: [
      "20+ short root domains to choose from",
      "Instant slug setup and availability validation",
      "Legacy QR slug redirects supported",
      "Custom CNAME on Pro plan",
    ],
    iconKey: "domain",
  },
  {
    slug: "easy-menu-management",
    title: "Easy online menu management",
    hero: "Build and update your menu in minutes, not hours",
    description:
      "Add categories and items with intuitive controls, reorder your content quickly, and use the AI photo parsing assistant to bootstrap from menu photos.",
    bullets: [
      "Fast create/edit flow for categories and items",
      "AI menu extraction from photos",
      "Built-in stock photo gallery",
      "Bulk-edit prices, allergens and tags",
    ],
    iconKey: "management",
  },
  {
    slug: "analytics",
    title: "Online menu analytics",
    hero: "Real insights about how guests use your menu",
    description:
      "See QR scans, page views, language preferences, devices and returning visitors. Paid plans unlock trend charts and rankings to optimize performance.",
    bullets: [
      "Scans & views with event timeline",
      "Language and device ranking on paid plans",
      "Device breakdown (iOS, Android, desktop)",
      "Returning visitors insight",
    ],
    iconKey: "analytics",
  },
  {
    slug: "flexible-design",
    title: "Flexible templates for online menu",
    hero: "Beautiful, responsive templates that match your brand",
    description:
      "Pick from curated templates, then customize colors, typography and density settings. Every template is mobile-first and responsive.",
    bullets: [
      "Classic template on Free, full template library on Starter+",
      "Live preview while you customize",
      "Custom fonts, colors and layout density",
      "Mobile-first, fast and accessible",
    ],
    iconKey: "templates",
  },
  {
    slug: "multilingual-menus",
    title: "Multilingual online menu",
    hero: "Translated by AI trained on culinary context",
    description:
      "Your menu is automatically translated into selected languages by an AI fine-tuned on dishes, ingredients and cooking techniques. Enable or disable languages anytime, and override any translation manually.",
    bullets: [
      "25+ languages including Catalan, Korean and Hindi",
      "Culinary-aware translations (no robotic literal output)",
      "Inline manual overrides per dish or category",
      "Locale switcher built into every template",
    ],
    iconKey: "multilingual",
  },
  {
    slug: "media-asset",
    title: "Media asset & global CDN",
    hero: "Your photos, served fast everywhere",
    description:
      "Every image can be delivered through an external CDN base URL and responsive WebP variants, so you can serve optimized media globally.",
    bullets: [
      "WebP variant URLs for optimized rendering",
      "Secure upload validation",
      "CDN base URL support",
      "Lazy loading + blur placeholders",
    ],
    iconKey: "media",
  },
  {
    slug: "multi-currency",
    title: "Multi-currency menu",
    hero: "Show prices in multiple currencies, all at once",
    description:
      "Support guests from anywhere. Configure multiple currencies and add multiple prices per dish for portions, sizes or alternative currencies.",
    bullets: [
      "All popular currencies supported",
      "Multiple prices per dish (portions, sizes, currencies)",
      "Currency selector in modern template",
      "Auto-formatted using guest's locale",
    ],
    iconKey: "currency",
  },
  {
    slug: "qr-code-generator",
    title: "QR code menu generator",
    hero: "Print-ready QR codes that actually look on-brand",
    description:
      "Customize your QR codes with brand colors, save designs per resource and export print-ready PNG, SVG or PDF.",
    bullets: [
      "Brand color customization",
      "Save and reuse multiple QR designs",
      "Export PNG, SVG and print-ready PDF",
    ],
    iconKey: "qr",
  },
];
