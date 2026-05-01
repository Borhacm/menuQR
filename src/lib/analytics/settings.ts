export type ResourceAnalyticsSettings = {
  itemTrackingEnabled: boolean;
  bestSellerDays: number;
  bestSellerViewWeight: number;
  bestSellerClickWeight: number;
  bestSellerMinInteractions: number;
};

export const defaultResourceAnalyticsSettings: ResourceAnalyticsSettings = {
  itemTrackingEnabled: false,
  bestSellerDays: 30,
  bestSellerViewWeight: 1,
  bestSellerClickWeight: 3,
  bestSellerMinInteractions: 3,
};

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  if (normalized < min) return fallback;
  return Math.min(normalized, max);
}

export function readResourceAnalyticsSettings(socialJson: unknown): ResourceAnalyticsSettings {
  const raw =
    socialJson && typeof socialJson === "object"
      ? ((socialJson as Record<string, unknown>).analytics as Record<string, unknown> | undefined)
      : undefined;
  if (!raw || typeof raw !== "object") return defaultResourceAnalyticsSettings;
  return {
    itemTrackingEnabled:
      typeof raw.itemTrackingEnabled === "boolean"
        ? raw.itemTrackingEnabled
        : defaultResourceAnalyticsSettings.itemTrackingEnabled,
    bestSellerDays: clampInt(
      raw.bestSellerDays,
      defaultResourceAnalyticsSettings.bestSellerDays,
      7,
      365
    ),
    bestSellerViewWeight: clampInt(
      raw.bestSellerViewWeight,
      defaultResourceAnalyticsSettings.bestSellerViewWeight,
      1,
      10
    ),
    bestSellerClickWeight: clampInt(
      raw.bestSellerClickWeight,
      defaultResourceAnalyticsSettings.bestSellerClickWeight,
      1,
      10
    ),
    bestSellerMinInteractions: clampInt(
      raw.bestSellerMinInteractions,
      defaultResourceAnalyticsSettings.bestSellerMinInteractions,
      1,
      100
    ),
  };
}
