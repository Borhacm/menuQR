import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ClassicTemplate } from "@/components/menu-templates/classic";
import { ModernTemplate } from "@/components/menu-templates/modern";
import { GridTemplate } from "@/components/menu-templates/grid";
import { canUseTemplates, hasAllergenFeature } from "@/config/plans";
import { enableItemAnalyticsTracking } from "@/config/features";
import { MenuTracker } from "@/components/analytics/menu-tracker";
import { readResourceAnalyticsSettings } from "@/lib/analytics/settings";

function hexToRgb(hex: string) {
  const cleaned = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
}

function luminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getTheme(themeJson: unknown) {
  const theme = themeJson && typeof themeJson === "object" ? (themeJson as Record<string, unknown>) : {};
  const resolved = {
    primary: typeof theme.primary === "string" ? theme.primary : "#ffd400",
    background: typeof theme.background === "string" ? theme.background : "#0d0d0d",
    surface: typeof theme.surface === "string" ? theme.surface : "#1a1a1a",
    text: typeof theme.text === "string" ? theme.text : "#f5f5f5",
    border: typeof theme.border === "string" ? theme.border : "#333333",
    fontFamily: typeof theme.fontFamily === "string" ? theme.fontFamily : "Inter",
    density: typeof theme.density === "string" ? theme.density : "comfortable",
  };
  if (contrastRatio(resolved.background, resolved.text) < 4.5) {
    resolved.text = contrastRatio(resolved.background, "#ffffff") > contrastRatio(resolved.background, "#111827")
      ? "#ffffff"
      : "#111827";
  }
  return resolved;
}

export async function renderPublicMenuPage({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Promise<{ locale?: string; currency?: string; template?: string }>;
}) {
  if (typeof slug !== "string" || !slug.trim()) {
    notFound();
  }
  const qs = await searchParams;

  const resource = await db.resource.findUnique({
    where: { slug },
    include: {
      organization: {
        select: {
          planId: true,
        },
      },
      menus: {
        orderBy: { position: "asc" },
        include: {
          categories: {
            where: { isActive: true },
            orderBy: { position: "asc" },
            include: {
              items: {
                where: { isActive: true },
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

  if (!resource) notFound();

  const categories = resource.menus.flatMap((menuEntry) =>
    menuEntry.categories.map((category) => ({
      ...category,
      __menuId: menuEntry.id,
      __menuName: menuEntry.name,
    }))
  );
  const locales = resource.enabledLocales.length
    ? resource.enabledLocales
    : [resource.defaultLocale];
  const locale = qs.locale && locales.includes(qs.locale) ? qs.locale : resource.defaultLocale;
  const translations =
    locale !== resource.defaultLocale
      ? await db.translation.findMany({
          where: {
            locale,
            entityId: {
              in: [
                resource.id,
                ...resource.menus.map((menuEntry) => menuEntry.id),
                ...resource.menus.flatMap((menuEntry) => menuEntry.categories.map((category) => category.id)),
                ...resource.menus.flatMap((menuEntry) =>
                  menuEntry.categories.flatMap((category) => category.items.map((item) => item.id))
                ),
              ],
            },
          },
        })
      : [];
  const translationMap = new Map(
    translations.map((entry) => [`${entry.entityType}:${entry.entityId}:${entry.field}`, entry.value])
  );

  const translatedTitle =
    translationMap.get(`RESOURCE:${resource.id}:name`) ?? resource.name;
  const translatedCategories = categories.map((category) => {
    const categoryName = translationMap.get(`CATEGORY:${category.id}:name`) ?? category.name;
    return {
      id: category.id,
      name: categoryName,
      description: category.description ?? null,
      items: category.items.map((item) => ({
      ...item,
      name: translationMap.get(`ITEM:${item.id}:name`) ?? item.name,
      description: translationMap.get(`ITEM:${item.id}:description`) ?? item.description,
    })),
    };
  });
  const theme = getTheme(resource.themeJson);
  const canShowAllergens = hasAllergenFeature(resource.organization.planId);
  const analyticsSettings = readResourceAnalyticsSettings(resource.socialJson);

  const requestedTemplate = qs.template;
  const requestedIsValid =
    requestedTemplate === "classic" || requestedTemplate === "modern" || requestedTemplate === "grid";
  const requestedOrDefault = requestedIsValid ? requestedTemplate : resource.templateId;
  const template = canUseTemplates(resource.organization.planId, 3)
    ? requestedOrDefault
    : "classic";
  const resolvedInitialCurrency =
    typeof qs.currency === "string" && qs.currency.trim() ? qs.currency.trim().toUpperCase() : resource.defaultCurrency;
  return (
    <main className="container mx-auto max-w-4xl px-4 py-6">
      <MenuTracker resourceId={resource.id} locale={locale} />
      <section className="mb-4 rounded-xl border border-border bg-card/60 p-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{resource.name}</p>
        <p>
          {locale === "es"
            ? "Información de alérgenos visible en etiquetas. Ante alergias severas, confirma con el personal."
            : "Allergen information is shown with labels. For severe allergies, confirm with staff."}
        </p>
        {resource.contactPhone ? <p>{locale === "es" ? "Contacto" : "Contact"}: {resource.contactPhone}</p> : null}
      </section>
      {template === "modern" ? (
        <ModernTemplate
          title={translatedTitle}
          categories={translatedCategories}
          locale={locale}
          locales={locales}
          theme={theme}
          canShowAllergens={canShowAllergens}
          initialCurrency={resolvedInitialCurrency}
          analytics={{
            resourceId: resource.id,
            enableItemTracking: analyticsSettings.itemTrackingEnabled || enableItemAnalyticsTracking,
          }}
        />
      ) : template === "grid" ? (
        <GridTemplate
          title={translatedTitle}
          categories={translatedCategories}
          locale={locale}
          locales={locales}
          theme={theme}
          canShowAllergens={canShowAllergens}
          initialCurrency={resolvedInitialCurrency}
        />
      ) : (
        <ClassicTemplate
          title={translatedTitle}
          categories={translatedCategories}
          locale={locale}
          locales={locales}
          theme={theme}
          canShowAllergens={canShowAllergens}
          initialCurrency={resolvedInitialCurrency}
        />
      )}
    </main>
  );
}
