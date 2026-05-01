import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { updateTemplateAction, updateTemplateStylesAction } from "@/lib/admin/template-actions";
import { Button } from "@/components/ui/button";
import { canUseTemplates, hasAllergenFeature } from "@/config/plans";
import { getAdminLocale, getAdminMessages } from "@/lib/admin/i18n";
import { ThemeControls } from "@/app/(app)/app/resource/theme-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassicTemplate } from "@/components/menu-templates/classic";
import { ModernTemplate } from "@/components/menu-templates/modern";
import { GridTemplate } from "@/components/menu-templates/grid";

type TemplatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const ctx = await requireTenantContext();
  const locale = await getAdminLocale();
  const labels = getAdminMessages(locale).templates;
  const params = (await searchParams) ?? {};
  const saved = params.saved === "styles";
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialTab = rawTab === "mobile-preview" ? "mobile-preview" : "style-editor";
  const rawPreviewLocale = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const rawTemplate = ctx.resource?.templateId;
  const currentTemplate =
    rawTemplate === "modern" || rawTemplate === "grid" || rawTemplate === "classic"
      ? rawTemplate
      : "classic";
  const canUseAllTemplates = canUseTemplates(ctx.organization.planId, 3);
  const resourceData = ctx.resource
    ? await db.resource.findUnique({
        where: { id: ctx.resource.id },
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
      })
    : null;
  const theme = (ctx.resource?.themeJson && typeof ctx.resource.themeJson === "object"
    ? ctx.resource.themeJson
    : {}) as Record<string, unknown>;
  const primaryColor =
    typeof theme.primary === "string" && theme.primary ? theme.primary : "#ffd400";
  const backgroundColor =
    typeof theme.background === "string" && theme.background ? theme.background : "#0d0d0d";
  const surfaceColor =
    typeof theme.surface === "string" && theme.surface ? theme.surface : "#1a1a1a";
  const textColor = typeof theme.text === "string" && theme.text ? theme.text : "#f5f5f5";
  const borderColor =
    typeof theme.border === "string" && theme.border ? theme.border : "#333333";
  const fontFamily = typeof theme.fontFamily === "string" && theme.fontFamily ? theme.fontFamily : "Inter";
  const density = typeof theme.density === "string" && theme.density ? theme.density : "comfortable";
  const canShowAllergens = hasAllergenFeature(ctx.organization.planId);
  const toSerializablePriceAmount = (amount: unknown): number | string => {
    if (typeof amount === "number" || typeof amount === "string") return amount;
    if (amount && typeof amount === "object" && "toString" in amount) {
      const asString = String((amount as { toString: () => string }).toString());
      const asNumber = Number(asString);
      return Number.isFinite(asNumber) ? asNumber : asString;
    }
    return 0;
  };
  const categories =
    resourceData?.menus
      ?.flatMap((menu) =>
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
                isGlutenFree: item.isGlutenFree,
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
      ) ?? [];
  const enabledLocales = resourceData
    ? resourceData.enabledLocales.length
      ? resourceData.enabledLocales
      : [resourceData.defaultLocale]
    : [locale];
  const previewLocale =
    rawPreviewLocale && enabledLocales.includes(rawPreviewLocale)
      ? rawPreviewLocale
      : (resourceData?.defaultLocale ?? locale);
  const translations =
    resourceData && previewLocale !== resourceData.defaultLocale
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
    resourceData ? (translationMap.get(`RESOURCE:${resourceData.id}:name`) ?? resourceData.name) : "Menu";
  const localizedCategories = categories.map((category) => ({
    ...category,
    name: (() => {
      const translatedCategory = translationMap.get(`CATEGORY:${category.id}:name`) ?? category.name;
      return translatedCategory;
    })(),
    items: category.items.map((item) => ({
      ...item,
      name: translationMap.get(`ITEM:${item.id}:name`) ?? item.name,
      description: translationMap.get(`ITEM:${item.id}:description`) ?? item.description,
    })),
  }));
  const previewTheme = {
    primary: primaryColor,
    background: backgroundColor,
    surface: surfaceColor,
    text: textColor,
    border: borderColor,
    fontFamily,
    density,
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{labels.title}</h1>
      {saved ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {labels.stylesSaved}
        </div>
      ) : null}
      {!canUseAllTemplates ? (
        <p className="text-sm text-muted-foreground">
          {labels.freePlanNotice}
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{labels.styleTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue={initialTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="style-editor">{labels.styleEditorTab}</TabsTrigger>
              <TabsTrigger value="mobile-preview">{labels.mobilePreviewTab}</TabsTrigger>
            </TabsList>

            <TabsContent value="style-editor" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{labels.formatDescription}</p>
                <div className="inline-flex items-center gap-2">
                  {(["classic", "modern", "grid"] as const).map((templateId) => (
                    <form key={templateId} action={updateTemplateAction}>
                      <input type="hidden" name="templateId" value={templateId} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        className={
                          currentTemplate === templateId
                            ? "border-primary/60 bg-primary/15 text-primary hover:bg-primary/20"
                            : undefined
                        }
                        disabled={currentTemplate === templateId || (!canUseAllTemplates && templateId !== "classic")}
                      >
                        {templateId[0].toUpperCase() + templateId.slice(1)}
                      </Button>
                    </form>
                  ))}
                </div>
              </div>
              <form action={updateTemplateStylesAction} className="grid gap-4 md:grid-cols-2">
                <ThemeControls
                  templateId={currentTemplate}
                  initialFontFamily={fontFamily}
                  initialDensity={density}
                  initialValues={{
                    primaryColor,
                    backgroundColor,
                    surfaceColor,
                    textColor,
                    borderColor,
                  }}
                  labels={getAdminMessages(locale).themeControls}
                  hints={{
                    stylePresets: labels.stylePresetsHint,
                    colorControls: labels.colorControlsHint,
                  }}
                  formLabels={{
                    fontFamily: labels.fontFamily,
                    density: labels.layoutDensity,
                    densityComfortable: labels.densityComfortable,
                    densityCompact: labels.densityCompact,
                  }}
                />
                <div className="md:col-span-2">
                  <Button type="submit">{labels.saveStyles}</Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="mobile-preview" className="space-y-3">
              <p className="text-sm text-muted-foreground">{labels.mobilePreviewDescription}</p>
              <div className="mx-auto w-full max-w-[420px] rounded-[2rem] border border-zinc-700 bg-zinc-900 p-2 shadow-2xl">
                <div className="mx-auto mb-2 h-5 w-28 rounded-full bg-zinc-700" />
                <div className="h-[720px] overflow-y-auto rounded-[1.5rem] border border-zinc-800 bg-black p-2">
                  {currentTemplate === "modern" ? (
                    <ModernTemplate
                      title={previewTitle}
                      categories={localizedCategories}
                      locale={previewLocale}
                      locales={enabledLocales}
                      theme={previewTheme}
                      canShowAllergens={canShowAllergens}
                    />
                  ) : currentTemplate === "grid" ? (
                    <GridTemplate
                      title={previewTitle}
                      categories={localizedCategories}
                      locale={previewLocale}
                      theme={previewTheme}
                    />
                  ) : (
                    <ClassicTemplate
                      title={previewTitle}
                      categories={localizedCategories}
                      locale={previewLocale}
                      theme={previewTheme}
                    />
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
