export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  gradient: string;
  body: string;
}

export const POSTS: BlogPost[] = [
  {
    slug: "online-ordering-delivery",
    title: "Online ordering & delivery now in beta",
    date: "2026-03-18",
    excerpt:
      "Take orders directly from your QR menu, integrated with major delivery providers and your favorite POS.",
    gradient: "from-amber-200 via-orange-200 to-rose-200",
    body: `We're rolling out a new ordering layer that lives on top of your menu...`,
  },
  {
    slug: "new-codewind-template",
    title: "Introducing the new Codewind menu template",
    date: "2026-02-17",
    excerpt:
      "A bold, modern template designed for cocktail bars and modern bistros. Dark first, fast everywhere.",
    gradient: "from-zinc-700 via-zinc-800 to-zinc-900",
    body: `Codewind is our most ambitious template yet...`,
  },
  {
    slug: "languages-update",
    title: "Menuly adds Catalan, Korean and Hindi",
    date: "2025-12-15",
    excerpt:
      "Our culinary AI now translates into 25 languages, including richer support for Asian cuisines.",
    gradient: "from-emerald-200 via-teal-200 to-cyan-200",
    body: `Today we're adding Catalan, Korean and Hindi to our translation set...`,
  },
  {
    slug: "qr-design-best-practices",
    title: "QR code design best practices for restaurants",
    date: "2025-11-04",
    excerpt:
      "Color contrast, error correction and physical placement: a quick guide to getting more scans.",
    gradient: "from-indigo-200 via-violet-200 to-purple-200",
    body: `A QR code that doesn't get scanned is just decoration...`,
  },
  {
    slug: "multi-currency-prices",
    title: "Why we built multi-currency prices into every plan",
    date: "2025-10-12",
    excerpt:
      "Tourist hubs, ski resorts and cruise ports: how multi-currency menus boost conversion and tickets.",
    gradient: "from-sky-200 via-cyan-200 to-blue-200",
    body: `Most digital menu tools force a single currency...`,
  },
  {
    slug: "case-study-trattoria",
    title: "How La Trattoria cut printing costs by 92%",
    date: "2025-09-01",
    excerpt:
      "A small family restaurant in Valencia switched to QR menus and never looked back.",
    gradient: "from-rose-200 via-pink-200 to-amber-200",
    body: `La Trattoria used to reprint their seasonal menus four times a year...`,
  },
];
