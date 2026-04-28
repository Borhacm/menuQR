export type PlanId = "free" | "standard" | "standard_plus";

export interface PlanLimits {
  maxItems: number;
  maxPhotosPerItem: number;
  maxLanguages: number;
  maxManagerSeats: number;
  aiPhotoParsing: "limited" | "full" | "none";
  prioritySupport: boolean;
  noAds: boolean;
}

export interface PlanDef {
  id: PlanId;
  name: string;
  priceMonthly: number;
  currency: string;
  trialDays: number;
  description: string;
  features: string[];
  limits: PlanLimits;
  stripePriceEnv?: string;
  popular?: boolean;
}

export const plans: PlanDef[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    currency: "EUR",
    trialDays: 0,
    description: "Perfect to try out Menuly with a small menu.",
    features: [
      "1 subdomain with menu",
      "Up to 25 items per menu",
      "1 photo per item",
      "Auto translation with culinary AI",
      "Limited AI photo parsing",
      "Multi-currency prices",
      "Unlimited design templates",
      "Built-in photo editor & CDN",
      "Unlimited QR scans & QR builder",
      "Basic analytics",
    ],
    limits: {
      maxItems: 25,
      maxPhotosPerItem: 1,
      maxLanguages: 2,
      maxManagerSeats: 1,
      aiPhotoParsing: "limited",
      prioritySupport: false,
      noAds: true,
    },
  },
  {
    id: "standard",
    name: "Standard",
    priceMonthly: 9.99,
    currency: "EUR",
    trialDays: 15,
    description: "For growing restaurants that need more capacity.",
    popular: true,
    features: [
      "1 subdomain with menu",
      "Up to 150 items per menu",
      "5 photos per item",
      "Full AI translation",
      "Full AI menu extraction from photos",
      "Multi-currency prices",
      "Unlimited design templates",
      "Built-in photo editor & CDN",
      "Unlimited QR scans & QR builder",
      "Advanced analytics",
      "Up to 10 manager accounts",
      "Priority email support",
    ],
    limits: {
      maxItems: 150,
      maxPhotosPerItem: 5,
      maxLanguages: 10,
      maxManagerSeats: 10,
      aiPhotoParsing: "full",
      prioritySupport: true,
      noAds: true,
    },
    stripePriceEnv: "STRIPE_PRICE_STANDARD",
  },
  {
    id: "standard_plus",
    name: "Standard Plus",
    priceMonthly: 19.99,
    currency: "EUR",
    trialDays: 15,
    description: "For chains and large menus with maximum flexibility.",
    features: [
      "1 subdomain with menu",
      "Up to 999 items per menu",
      "10 photos per item",
      "Full AI translation",
      "Full AI menu extraction from photos",
      "Multi-currency prices",
      "Unlimited design templates",
      "Built-in photo editor & CDN",
      "Unlimited QR scans & QR builder",
      "Advanced analytics",
      "Up to 10 manager accounts",
      "Priority email support",
      "Menu digitization help",
    ],
    limits: {
      maxItems: 999,
      maxPhotosPerItem: 10,
      maxLanguages: 25,
      maxManagerSeats: 10,
      aiPhotoParsing: "full",
      prioritySupport: true,
      noAds: true,
    },
    stripePriceEnv: "STRIPE_PRICE_STANDARD_PLUS",
  },
];

export function getPlan(id: string): PlanDef {
  return plans.find((p) => p.id === id) ?? plans[0];
}
