export type PlanId = "free" | "starter" | "pro";

export interface PlanLimits {
  maxItems: number;
  maxPhotosPerItem: number;
  maxLanguages: number;
  maxManagerSeats: number;
  aiPhotoParsing: "limited" | "full" | "none";
  prioritySupport: boolean;
  noAds: boolean;
  allergens: boolean;
  templatesCount: number;
  multiCurrency: boolean;
  analyticsCharts: boolean;
  analyticsAdvanced: boolean;
  qrBranding: boolean;
  customDomain: boolean;
  mediaCdnTransforms: boolean;
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
      "Launch-ready setup wizard",
      "1 subdomain with menu",
      "Up to 25 items per menu",
      "1 photo per item",
      "Single-language menu",
      "Single currency pricing",
      "Classic template",
      "Basic QR export (PNG/SVG/PDF)",
      "Basic analytics summary",
    ],
    limits: {
      maxItems: 25,
      maxPhotosPerItem: 1,
      maxLanguages: 2,
      maxManagerSeats: 1,
      aiPhotoParsing: "none",
      prioritySupport: false,
      noAds: true,
      allergens: false,
      templatesCount: 1,
      multiCurrency: false,
      analyticsCharts: false,
      analyticsAdvanced: false,
      qrBranding: false,
      customDomain: false,
      mediaCdnTransforms: false,
    },
  },
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 9.99,
    currency: "EUR",
    trialDays: 15,
    description: "For growing restaurants that need more capacity.",
    popular: true,
    features: [
      "Everything in Free",
      "1 subdomain with menu",
      "Up to 150 items per menu",
      "5 photos per item",
      "Full AI translation",
      "Full AI menu extraction from photos",
      "Multi-currency prices",
      "Classic/Modern/Grid templates",
      "QR branding and saved designs",
      "Analytics charts and rankings",
      "Manual translation overrides",
      "Locale and currency selectors on menu",
      "Allergen labels",
    ],
    limits: {
      maxItems: 150,
      maxPhotosPerItem: 5,
      maxLanguages: 10,
      maxManagerSeats: 10,
      aiPhotoParsing: "full",
      prioritySupport: false,
      noAds: true,
      allergens: true,
      templatesCount: 3,
      multiCurrency: true,
      analyticsCharts: true,
      analyticsAdvanced: false,
      qrBranding: true,
      customDomain: false,
      mediaCdnTransforms: false,
    },
    stripePriceEnv: "STRIPE_PRICE_STARTER",
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 19.99,
    currency: "EUR",
    trialDays: 15,
    description: "For chains and large menus with maximum flexibility.",
    features: [
      "Everything in Starter",
      "1 subdomain with menu",
      "Up to 999 items per menu",
      "10 photos per item",
      "Full AI translation",
      "Full AI menu extraction from photos",
      "Multi-currency prices",
      "Classic/Modern/Grid templates",
      "CDN image transforms",
      "Custom domain support",
      "Advanced analytics",
      "Up to 10 manager accounts",
      "Priority support",
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
      allergens: true,
      templatesCount: 3,
      multiCurrency: true,
      analyticsCharts: true,
      analyticsAdvanced: true,
      qrBranding: true,
      customDomain: true,
      mediaCdnTransforms: true,
    },
    stripePriceEnv: "STRIPE_PRICE_PRO",
  },
];

export function getPlan(id: string): PlanDef {
  return plans.find((p) => p.id === id) ?? plans[0];
}

export function hasAllergenFeature(planId: string): boolean {
  return getPlan(planId).limits.allergens;
}

export function hasPaidPlan(planId: string): boolean {
  return planId !== "free";
}

export function canUseTemplates(planId: string, requestedCount = 3): boolean {
  return getPlan(planId).limits.templatesCount >= requestedCount;
}

export function canUseMultiCurrency(planId: string): boolean {
  return getPlan(planId).limits.multiCurrency;
}

export function canUseAnalyticsCharts(planId: string): boolean {
  return getPlan(planId).limits.analyticsCharts;
}

export function canUseAdvancedAnalytics(planId: string): boolean {
  return getPlan(planId).limits.analyticsAdvanced;
}

export function canUseQrBranding(planId: string): boolean {
  return getPlan(planId).limits.qrBranding;
}

export function canUseCustomDomain(planId: string): boolean {
  return getPlan(planId).limits.customDomain;
}

export function canUseMediaCdnTransforms(planId: string): boolean {
  return getPlan(planId).limits.mediaCdnTransforms;
}
