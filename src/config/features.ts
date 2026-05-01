function envFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export const enableItemAnalyticsTracking = envFlag(process.env.NEXT_PUBLIC_ENABLE_ITEM_ANALYTICS);
