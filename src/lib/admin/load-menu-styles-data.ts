import { db } from "@/lib/db";
import { hasAllergenFeature } from "@/config/plans";
import type { AdminLocale } from "@/lib/admin/i18n";

type TemplateId = "classic" | "modern" | "grid";

function toSerializablePriceAmount(amount: unknown): number | string {
  if (typeof amount === "number" || typeof amount === "string") return amount;
  if (amount && typeof amount === "object" && "toString" in amount) {
    const asString = String((amount as { toString: () => string }).toString());
    const asNumber = Number(asString);
    return Number.isFinite(asNumber) ? asNumber : asString;
  }
  return 0;
}

export type MenuStylesLoaded = {
  rawTemplate: TemplateId;
  canShowAllergens: boolean;
  /** Resource default currency for template price resolution (demo / preview). */
  defaultCurrency: string;
  previewTitle: string;
  previewLocale: string;
  enabledLocales: string[];
  localizedCategories: Array<{
    id: string;
    menuId: string;
    name: string;
    description: string | null;
    items: Array<{
      id: string;
      name: string;
      description: string | null;
      isFeatured: boolean;
      isVegan: boolean;
      isVegetarian: boolean;
      isSpicy: boolean;
      prices: Array<{ id: string; amount: number | string; currency: string }>;
      images: Array<{ id: string; url: string; alt: string | null }>;
      allergens: Array<{
        allergen: { id: string; code: string; name: string; icon: string | null };
      }>;
    }>;
  }>;
  previewTheme: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    fontFamily: string;
    density: string;
  };
};

export async function loadMenuStylesData(opts: {
  resourceId: string;
  organizationPlanId: string;
  adminLocale: AdminLocale;
  rawPreviewLocale?: string;
  themeJson: unknown;
  templateIdRaw: string | null | undefined;
}): Promise<MenuStylesLoaded | null> {
  const { resourceId, organizationPlanId, adminLocale, rawPreviewLocale, themeJson, templateIdRaw } = opts;

  const resourceData = await db.resource.findUnique({
    where: { id: resourceId },
    include: {
      menus: {
        orderBy: { position: "asc" },
        include: {
          categories: {
            orderBy: { position: "asc" },
            include: {
              items: {
                orderBy: { position: "asc" },
                include: {
                  prices: { orderBy: { position: "asc" } },
                  images: { orderBy: { position: "asc" }, take: 1 },
                  allergens: { include: { allergen: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!resourceData) return null;

  const rawTemplate: TemplateId =
    templateIdRaw === "modern" || templateIdRaw === "grid" || templateIdRaw === "classic"
      ? templateIdRaw
      : "classic";

  const theme = (themeJson && typeof themeJson === "object" ? themeJson : {}) as Record<string, unknown>;
  const primaryColor = typeof theme.primary === "string" && theme.primary ? theme.primary : "#ffd400";
  const backgroundColor =
    typeof theme.background === "string" && theme.background ? theme.background : "#0d0d0d";
  const surfaceColor = typeof theme.surface === "string" && theme.surface ? theme.surface : "#1a1a1a";
  const textColor = typeof theme.text === "string" && theme.text ? theme.text : "#f5f5f5";
  const borderColor = typeof theme.border === "string" && theme.border ? theme.border : "#333333";
  const fontFamily = typeof theme.fontFamily === "string" && theme.fontFamily ? theme.fontFamily : "Inter";
  const density = typeof theme.density === "string" && theme.density ? theme.density : "comfortable";

  const canShowAllergens = hasAllergenFeature(organizationPlanId);

  const categories =
    resourceData.menus.flatMap((menu) =>
      (menu.categories ?? [])
        .filter((category) => category.isActive)
        .map((category) => ({
          id: category.id,
          menuId: menu.id,
          name: category.name,
          description: category.description ?? null,
          items: (category.items ?? [])
            .filter((item) => item.isActive)
            .map((item) => ({
              id: item.id,
              name: item.name,
              description: item.description ?? null,
              isFeatured: item.isFeatured,
              isVegan: item.isVegan,
              isVegetarian: item.isVegetarian,
              isSpicy: item.isSpicy,
              prices: (item.prices ?? []).map((price) => ({
                id: price.id,
                amount: toSerializablePriceAmount(price.amount),
                currency: price.currency,
              })),
              images: (item.images ?? []).map((image) => ({
                id: image.id,
                url: image.url,
                alt: image.alt ?? null,
              })),
              allergens: (item.allergens ?? []).map((entry) => ({
                allergen: {
                  id: entry.allergen.id,
                  code: entry.allergen.code,
                  name: entry.allergen.name,
                  icon: entry.allergen.icon,
                },
              })),
            })),
        }))
    );

  const enabledLocales = resourceData.enabledLocales.length
    ? resourceData.enabledLocales
    : [resourceData.defaultLocale];

  const previewLocale =
    rawPreviewLocale && enabledLocales.includes(rawPreviewLocale)
      ? rawPreviewLocale
      : (resourceData.defaultLocale ?? adminLocale);

  const translations =
    previewLocale !== resourceData.defaultLocale
      ? await db.translation.findMany({
          where: {
            locale: previewLocale,
            entityId: {
              in: [
                resourceData.id,
                ...resourceData.menus.map((menu) => menu.id),
                ...resourceData.menus.flatMap((menu) => menu.categories.map((category) => category.id)),
                ...resourceData.menus.flatMap((menu) =>
                  menu.categories.flatMap((category) => category.items.map((item) => item.id))
                ),
              ],
            },
          },
        })
      : [];

  const translationMap = new Map(
    translations.map((entry) => [`${entry.entityType}:${entry.entityId}:${entry.field}`, entry.value])
  );

  const previewTitle =
    (translationMap.get(`RESOURCE:${resourceData.id}:name`) ?? resourceData.name) || "Menu";

  const localizedCategories = categories.map((category) => ({
    ...category,
    name: translationMap.get(`CATEGORY:${category.id}:name`) ?? category.name,
    items: category.items.map((item) => ({
      ...item,
      name: translationMap.get(`ITEM:${item.id}:name`) ?? item.name,
      description: translationMap.get(`ITEM:${item.id}:description`) ?? item.description,
    })),
  }));

  const defaultCurrency = (resourceData.defaultCurrency || "EUR").trim().toUpperCase() || "EUR";

  return {
    rawTemplate,
    canShowAllergens,
    defaultCurrency,
    previewTitle,
    previewLocale,
    enabledLocales,
    localizedCategories,
    previewTheme: {
      primary: primaryColor,
      background: backgroundColor,
      surface: surfaceColor,
      text: textColor,
      border: borderColor,
      fontFamily,
      density,
    },
  };
}
