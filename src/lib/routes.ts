export const appRoutes = {
  dashboard: "/app",
  menus: "/app/menus",
  items: "/app/items",
  templates: "/app/templates",
  translations: "/app/translations",
  qr: "/app/qr",
  analytics: "/app/analytics",
  billing: "/app/billing",
  team: "/app/team",
  settings: "/app/settings",
} as const;

type AppRouteKey = keyof typeof appRoutes;

type QueryValue = string | number | boolean | undefined;

export const billingStatus = {
  success: "success",
  cancel: "cancel",
  invalidPlan: "invalid_plan",
  missingConfig: "missing_config",
} as const;

export type BillingStatus = (typeof billingStatus)[keyof typeof billingStatus];

export const teamInviteStatus = {
  accepted: "accepted",
  invited: "invited",
  alreadyMember: "already_member",
  alreadyPending: "already_pending",
  forbidden: "forbidden",
  invalid: "invalid",
  rateLimited: "rate_limited",
} as const;

export type TeamInviteStatus = (typeof teamInviteStatus)[keyof typeof teamInviteStatus];

export function appHref(route: AppRouteKey, query?: Record<string, QueryValue>) {
  const base = appRoutes[route];
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export function appUrl(reqUrl: string, route: AppRouteKey, query?: Record<string, QueryValue>) {
  return new URL(appHref(route, query), reqUrl);
}

