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
      "Pick from a curated set of short root domains and combine them with your brand to create a personal web address for your QR menu. No registrations, no delays — go live the moment you choose your slug.",
    bullets: [
      "20+ short root domains to choose from",
      "Instant availability check & reservation",
      "Change your slug anytime (legacy QR codes keep redirecting)",
      "Optional custom CNAME for enterprise plans",
    ],
    iconKey: "domain",
  },
  {
    slug: "easy-menu-management",
    title: "Easy online menu management",
    hero: "Build and update your menu in minutes, not hours",
    description:
      "Add categories and items with intuitive drag-and-drop controls, reorder dishes with a click, and let our AI photo-parsing assistant turn an existing PDF or photo into a structured menu in seconds.",
    bullets: [
      "Drag-and-drop categories and items",
      "AI menu extraction from photos & PDFs",
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
      "See QR scans, page views, language preferences, devices and returning visitors in clean, real-time charts. Use the data to optimize your menu, understand peak hours, and prove ROI.",
    bullets: [
      "Scans & views by day, week and month",
      "Language ranking — know what your guests prefer",
      "Device breakdown (iOS, Android, desktop)",
      "Returning visitors and average session duration",
    ],
    iconKey: "analytics",
  },
  {
    slug: "flexible-design",
    title: "Flexible templates for online menu",
    hero: "Beautiful, responsive templates that match your brand",
    description:
      "Pick from our curated library of templates, then customize colors, typography, hero imagery and section layouts. Every template is mobile-first, fast, and accessible by default.",
    bullets: [
      "Multiple ready-made templates",
      "Live preview while you customize",
      "Custom fonts, colors, hero imagery",
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
      "Every image you upload is processed into multiple sizes and formats (WebP and responsive variants) and served from a global CDN, so the right version reaches every device — no matter where your guests are.",
    bullets: [
      "Automatic WebP + responsive variants",
      "Built-in image editor & cropper",
      "Global CDN with regional caching",
      "Lazy loading + blur placeholders",
    ],
    iconKey: "media",
  },
  {
    slug: "multi-currency",
    title: "Multi-currency menu",
    hero: "Show prices in multiple currencies, all at once",
    description:
      "Support guests from anywhere. Configure several currencies on your menu and add multiple prices per dish for portions, sizes or alternative currencies — perfect for tourist areas and flexible pricing.",
    bullets: [
      "All popular currencies supported",
      "Multiple prices per dish (portions, sizes, currencies)",
      "Currency switcher in every template",
      "Auto-formatted using guest's locale",
    ],
    iconKey: "currency",
  },
  {
    slug: "qr-code-generator",
    title: "QR code menu generator",
    hero: "Print-ready QR codes that actually look on-brand",
    description:
      "Customize your QR codes with your logo, brand colors and unique eye styles, then export print-ready PNG, SVG or PDF. Save multiple designs per resource and reprint anytime.",
    bullets: [
      "Logo embedding with safe-zone control",
      "Color & gradient customization",
      "Save and reuse multiple QR designs",
      "Export PNG, SVG and print-ready PDF",
    ],
    iconKey: "qr",
  },
];
