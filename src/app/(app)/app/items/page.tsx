import { db } from "@/lib/db";
import { createHash } from "node:crypto";
import { requireTenantContext } from "@/lib/auth/guards";
import {
  appendItemImageAction,
  acceptAllTranslationsAction,
  createMenuAction,
  createItemAction,
  deleteItemImageAction,
  deleteMenuAction,
  deleteItemAction,
  markTranslationDraftAction,
  moveMenuAction,
  saveTranslationOverrideAction,
  updateMenuAction,
  updateItemAction,
} from "@/lib/admin/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { appHref, appRoutes } from "@/lib/routes";
import {
  canUseMultiCurrency,
  canUseQrBranding,
  canUseTemplates,
  getPlan,
  hasAllergenFeature,
} from "@/config/plans";
import { loadMenuStylesData } from "@/lib/admin/load-menu-styles-data";
import { MenuStyleEditorPanel, MenuStyleMobilePreviewPanel } from "@/components/admin/menu-styles-panels";
import { MenuQrDashboard } from "@/components/admin/menu-qr-dashboard";
import { MenuProcessStepper } from "@/components/admin/menu-process-stepper";
import Image from "next/image";
import Link from "next/link";
import { shouldOptimizeImageSrc } from "@/lib/images";
import { ItemFormAssistant } from "@/components/admin/item-form-assistant";
import { getAdminLocale, getAdminMessages } from "@/lib/admin/i18n";
import { isVisibleAllergen, localizeAllergenName } from "@/lib/allergens";
import { ActionSubmitButton } from "@/components/admin/action-submit-button";
import { ItemEditPhotosPanel } from "@/components/admin/item-edit-photos-panel";
import { ItemsFeedbackToasts } from "@/components/admin/items-feedback-toasts";
import { ItemsListScrollAnchor } from "@/components/admin/items-list-scroll-anchor";
import { cn } from "@/lib/utils";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const isLegacyMainCategory = (value: string) => {
    const normalized = value.trim().toLowerCase();
    return normalized === "main" || normalized === "principal";
  };
  const getSourceHash = (value: string) => createHash("sha256").update(value.trim()).digest("hex");

  const params = searchParams ? await searchParams : undefined;
  type MenuTab = "categories" | "products" | "translations" | "style-editor" | "mobile-preview" | "qr";
  const rawTab = Array.isArray(params?.tab) ? params?.tab[0] : params?.tab;
  const MENU_TAB_IDS: ReadonlySet<MenuTab> = new Set([
    "categories",
    "products",
    "translations",
    "style-editor",
    "mobile-preview",
    "qr",
  ]);
  const rawTabStr = typeof rawTab === "string" ? rawTab : "";
  const initialTab: MenuTab =
    MENU_TAB_IDS.has(rawTabStr as MenuTab) ? (rawTabStr as MenuTab) : "categories";
  const rawSavedStyles =
    typeof params?.saved === "string" ? params.saved : Array.isArray(params?.saved) ? params.saved[0] : undefined;
  const stylesSavedBanner = rawSavedStyles === "styles";
  const rawStatus = Array.isArray(params?.status) ? params.status[0] : params?.status;
  const status = typeof rawStatus === "string" ? rawStatus : undefined;
  const rawDeleted = Array.isArray(params?.deleted) ? params.deleted[0] : params?.deleted;
  const deleted = typeof rawDeleted === "string" ? rawDeleted : undefined;
  const rawUpdated = Array.isArray(params?.updated) ? params.updated[0] : params?.updated;
  const updated = typeof rawUpdated === "string" ? rawUpdated : undefined;
  const rawUpdateError = Array.isArray(params?.updateError) ? params.updateError[0] : params?.updateError;
  const updateError = typeof rawUpdateError === "string" ? rawUpdateError : undefined;
  const rawEditItemId = Array.isArray(params?.editItemId) ? params.editItemId[0] : params?.editItemId;
  const editItemId = typeof rawEditItemId === "string" ? rawEditItemId : "";
  const rawInventoryCategory =
    typeof params?.categoryId === "string"
      ? params.categoryId
      : Array.isArray(params?.categoryId)
        ? params.categoryId[0]
        : params?.categoryId;
  const ctx = await requireTenantContext();
  const locale = await getAdminLocale();
  const m = getAdminMessages(locale);
  const t = m.items;
  const menusT = m.menus;
  const translationsT = m.translations;
  const templatesT = m.templates;
  const qrT = m.qr;
  const canUseAllergens = hasAllergenFeature(ctx.organization.planId);
  const canUseMultipleCurrencies = canUseMultiCurrency(ctx.organization.planId);
  const allergens = await db.allergen.findMany({ orderBy: { name: "asc" } });
  const items = ctx.resource
    ? await db.item.findMany({
        where: { category: { menu: { resourceId: ctx.resource.id } } },
        include: {
          prices: true,
          category: true,
          images: { orderBy: { position: "asc" } },
          allergens: { include: { allergen: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const categories = ctx.resource
    ? await db.category.findMany({
        where: { menu: { resourceId: ctx.resource.id } },
        orderBy: [{ menu: { position: "asc" } }, { position: "asc" }],
        include: { menu: true },
      })
    : [];
  const categoryFilterFromUrl =
    typeof rawInventoryCategory === "string" &&
    categories.some((c) => c.id === rawInventoryCategory)
      ? rawInventoryCategory
      : null;
  const menus = ctx.resource
    ? await db.menu.findMany({
        where: { resourceId: ctx.resource.id },
        orderBy: { position: "asc" },
        include: { categories: true },
      })
    : [];
  const hasMultipleGroups = new Set(categories.map((category) => category.menuId)).size > 1;
  const availableCurrencies = Array.from(
    new Set(
      ctx.resource
        ? [ctx.resource.defaultCurrency, ...ctx.resource.enabledCurrencies].map((currency) =>
            currency.toUpperCase()
          )
        : ["EUR"]
    )
  );
  const categoryLabel = (category: (typeof categories)[number]) =>
    category.name.toLowerCase() === "main" ? category.menu.name : category.name;
  const categoryOptionLabel = (category: (typeof categories)[number]) => {
    const label = categoryLabel(category);
    if (!hasMultipleGroups) return label;
    return category.menu.name === label ? label : `${category.menu.name} - ${label}`;
  };
  const filteredInventoryItems = categoryFilterFromUrl
    ? items.filter((item) => item.categoryId === categoryFilterFromUrl)
    : items;
  const persistInventoryCategory =
    categoryFilterFromUrl ? { categoryId: categoryFilterFromUrl } : {};
  const isDefaultPriceLabel = (label: string | null) => {
    const normalized = (label ?? "").trim().toLowerCase();
    return !normalized || normalized === "default" || normalized === "regular";
  };
  const statusMap: Record<string, string> = {
    done:
      locale === "es"
        ? "Traducción completada. Revisa y ajusta los textos si hace falta."
        : "Translation completed. Review and adjust texts if needed.",
    failed:
      locale === "es"
        ? "La traducción falló. Revisa sesión y configuración del proveedor, luego vuelve a intentar."
        : "Translation failed. Check session and provider configuration, then try again.",
    no_resource:
      locale === "es"
        ? "No encontramos un recurso activo para traducir en este workspace."
        : "No active resource was found to translate in this workspace.",
    db_unavailable:
      locale === "es"
        ? "La base de datos no está disponible en este momento. Inicia Docker y vuelve a intentar."
        : "Database is currently unavailable. Start Docker and try again.",
    accepted:
      locale === "es"
        ? "Traducción aceptada. Este campo no se volverá a traducir automáticamente."
        : "Translation accepted. This field will not be auto-translated again.",
    editing:
      locale === "es"
        ? "Edición habilitada. Este campo puede sobrescribirse al traducir de nuevo hasta que vuelvas a aceptarlo."
        : "Editing enabled. This field can be overwritten by auto-translation until accepted again.",
  };
  const resourceForTranslations = ctx.resource
    ? await db.resource.findUnique({
        where: { id: ctx.resource.id },
        include: {
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
                    },
                  },
                },
              },
            },
          },
        },
      })
    : null;
  const translationPlan = getPlan(ctx.organization.planId);
  const targetLocales = resourceForTranslations
    ? resourceForTranslations.enabledLocales
        .filter((enabledLocale) => enabledLocale !== resourceForTranslations.defaultLocale)
        .slice(0, translationPlan.limits.maxLanguages)
    : [];
  const translationEntries =
    resourceForTranslations && targetLocales.length
      ? await db.translation.findMany({
          where: {
            locale: { in: targetLocales },
            OR: [
              { entityType: "RESOURCE", entityId: resourceForTranslations.id },
              ...resourceForTranslations.menus.map((menu) => ({ entityType: "MENU" as const, entityId: menu.id })),
              ...resourceForTranslations.menus.flatMap((menu) =>
                menu.categories.map((category) => ({ entityType: "CATEGORY" as const, entityId: category.id }))
              ),
              ...resourceForTranslations.menus.flatMap((menu) =>
                menu.categories.flatMap((category) =>
                  category.items.map((item) => ({ entityType: "ITEM" as const, entityId: item.id }))
                )
              ),
              ...resourceForTranslations.menus.flatMap((menu) =>
                menu.categories.flatMap((category) =>
                  category.items.flatMap((item) =>
                    item.prices.map((price) => ({ entityType: "ITEM_PRICE" as const, entityId: price.id }))
                  )
                )
              ),
            ],
          },
        })
      : [];
  const translationMap = new Map(
    translationEntries.map((entry) => [`${entry.locale}:${entry.entityType}:${entry.entityId}:${entry.field}`, entry])
  );

  const allTranslationsAccepted = (() => {
    if (!resourceForTranslations || targetLocales.length === 0) return true;
    const translationCategories = resourceForTranslations.menus.flatMap((menu) =>
      menu.categories.filter((category) => !isLegacyMainCategory(category.name))
    );
    for (const targetLocale of targetLocales) {
      const resourceEntry = translationMap.get(`${targetLocale}:RESOURCE:${resourceForTranslations.id}:name`);
      if (resourceEntry?.status !== "APPROVED") return false;
      for (const category of translationCategories) {
        const categoryEntry = translationMap.get(`${targetLocale}:CATEGORY:${category.id}:name`);
        if (categoryEntry?.status !== "APPROVED") return false;
        for (const item of category.items) {
          const itemNameEntry = translationMap.get(`${targetLocale}:ITEM:${item.id}:name`);
          if (itemNameEntry?.status !== "APPROVED") return false;
          if ((item.description ?? "").trim()) {
            const itemDescEntry = translationMap.get(`${targetLocale}:ITEM:${item.id}:description`);
            if (itemDescEntry?.status !== "APPROVED") return false;
          }
          for (const price of item.prices) {
            if (isDefaultPriceLabel(price.label)) continue;
            const priceEntry = translationMap.get(`${targetLocale}:ITEM_PRICE:${price.id}:label`);
            if (priceEntry?.status !== "APPROVED") return false;
          }
        }
      }
    }
    return true;
  })();
  const rawLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const defaultLocaleTab =
    typeof rawLocale === "string" && targetLocales.includes(rawLocale) ? rawLocale : (targetLocales[0] ?? "");

  const menuStylesData =
    ctx.resource && (initialTab === "style-editor" || initialTab === "mobile-preview") ?
      await loadMenuStylesData({
        resourceId: ctx.resource.id,
        organizationPlanId: ctx.organization.planId,
        adminLocale: locale,
        rawPreviewLocale: defaultLocaleTab || undefined,
        themeJson: ctx.resource.themeJson,
        templateIdRaw: ctx.resource.templateId,
      })
    : null;

  const qrDesigns =
    ctx.resource && initialTab === "qr" ?
      await db.qrDesign.findMany({
        where: { resourceId: ctx.resource.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const canUseAllTemplates = canUseTemplates(ctx.organization.planId, 3);

  function tabHref(tab: MenuTab) {
    const q: Record<string, string | undefined> = { tab };
    if ((tab === "categories" || tab === "products") && editItemId) q.editItemId = editItemId;
    if ((tab === "categories" || tab === "products") && categoryFilterFromUrl) q.categoryId = categoryFilterFromUrl;
    if ((tab === "translations" || tab === "mobile-preview") && defaultLocaleTab) q.locale = defaultLocaleTab;
    return appHref("items", q);
  }

  const processSteps: ReadonlyArray<
    readonly [
      MenuTab,
      string,
    ]
  > = [
    ["categories", menusT.title] as const,
    ["products", t.title] as const,
    ["translations", translationsT.title] as const,
    ["style-editor", templatesT.styleEditorTab] as const,
    ["mobile-preview", templatesT.mobilePreviewTab] as const,
    ["qr", qrT.tabLabel] as const,
  ];
  const hasMinimumMenuData = menus.length > 0 && items.length > 0;

  function isStepUnlocked(tab: MenuTab) {
    switch (tab) {
      case "categories":
        return true;
      case "products":
        return menus.length > 0;
      case "translations":
        return hasMinimumMenuData;
      case "style-editor":
      case "mobile-preview":
      case "qr":
        return hasMinimumMenuData && allTranslationsAccepted;
      default:
        return true;
    }
  }

  const processStepItems = processSteps.map(([tabSlug, tabLabel]) => ({
    tab: tabSlug,
    label: tabLabel,
    href: tabHref(tabSlug),
    unlocked: isStepUnlocked(tabSlug),
  }));

  return (
    <div className="space-y-4">
      <ItemsFeedbackToasts
        locale={locale}
        updated={Boolean(updated)}
        deleted={Boolean(deleted && initialTab === "products")}
        updateError={Boolean(updateError)}
      />
      <h1 className="font-display text-2xl font-bold">{m.nav.menu}</h1>
      {status && statusMap[status] && initialTab === "translations" ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {statusMap[status]}
        </div>
      ) : null}
      {initialTab === "translations" && !allTranslationsAccepted ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {locale === "es"
            ? "Debes aceptar todas las traducciones para avanzar a Estilos, Previsualización y QR."
            : "You must accept all translations before moving to Styles, Preview, and QR."}
        </div>
      ) : null}
      {deleted && initialTab === "products" ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {locale === "es"
            ? "Producto eliminado correctamente. Puede tardar unos segundos en reflejarse en toda la interfaz."
            : "Product deleted successfully. It can take a few seconds to reflect across the UI."}
        </div>
      ) : null}
      {deleted && initialTab === "categories" ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {locale === "es"
            ? "Categoría o menú eliminado correctamente. Puede tardar unos segundos en reflejarse en toda la interfaz."
            : "Category or menu deleted successfully. It can take a few seconds to reflect across the UI."}
        </div>
      ) : null}
      {stylesSavedBanner && initialTab === "style-editor" ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {templatesT.stylesSaved}
        </div>
      ) : null}
      <MenuProcessStepper
        steps={processStepItems}
        activeTab={initialTab}
        locale={locale}
      />

      {initialTab === "categories" ? (
      <div className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{menusT.createTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createMenuAction} className="flex flex-col gap-2 sm:flex-row">
                <Input name="name" placeholder={menusT.namePlaceholder} />
                <Button type="submit" className="sm:w-auto">
                  {menusT.add}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{menusT.existingTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-xs text-muted-foreground">
                {locale === "es"
                  ? "El orden de estas categorías se usa en la vista pública del menú. Ajusta con subir/bajar."
                  : "The order of these categories is used in the public menu view. Adjust it with up/down."}
              </p>
              {menus.map((menu) => (
                <div key={menu.id} className="rounded-md border p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                    <form action={updateMenuAction} className="contents">
                      <input type="hidden" name="menuId" value={menu.id} />
                      <Input name="name" defaultValue={menu.name} />
                      <Button type="submit" size="sm" variant="outline">
                        {menusT.save}
                      </Button>
                    </form>
                    <div className="flex gap-2">
                      <form action={moveMenuAction}>
                        <input type="hidden" name="menuId" value={menu.id} />
                        <input type="hidden" name="direction" value="up" />
                        <Button type="submit" size="sm" variant="outline" aria-label={locale === "es" ? "Subir" : "Move up"}>
                          ↑
                        </Button>
                      </form>
                      <form action={moveMenuAction}>
                        <input type="hidden" name="menuId" value={menu.id} />
                        <input type="hidden" name="direction" value="down" />
                        <Button type="submit" size="sm" variant="outline" aria-label={locale === "es" ? "Bajar" : "Move down"}>
                          ↓
                        </Button>
                      </form>
                    </div>
                    <form action={deleteMenuAction}>
                      <input type="hidden" name="menuId" value={menu.id} />
                      <ActionSubmitButton
                        size="sm"
                        variant="destructive"
                        idleLabel={menusT.delete}
                        pendingLabel={locale === "es" ? "Eliminando..." : "Deleting..."}
                        confirmMessage={menusT.deleteConfirm}
                      />
                    </form>
                  </div>
                </div>
              ))}
              {!menus.length ? <p className="text-muted-foreground">{menusT.empty}</p> : null}
            </CardContent>
          </Card>
      </div>
      ) : null}

      {initialTab === "products" ? (
      <div className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.createTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createItemAction} className="grid gap-3 md:grid-cols-2">
                <ItemFormAssistant
                  canUseMultipleCurrencies={canUseMultipleCurrencies}
                  availableCurrencies={availableCurrencies}
                  categoryOptions={categories.map((category) => ({
                    id: category.id,
                    label: categoryOptionLabel(category),
                  }))}
                  categoryFieldLabel={t.category}
                  canUseAllergens={canUseAllergens}
                  allergenOptions={allergens
                    .filter((allergen) => isVisibleAllergen(allergen.code))
                    .map((allergen) => ({
                      code: allergen.code,
                      label: `${allergen.icon ? `${allergen.icon} ` : ""}${localizeAllergenName(allergen.code, locale, allergen.name)}`,
                    }))}
                  allergensLabel={t.allergens}
                  allergensPaidOnlyLabel={t.allergensPaidOnly}
                  upgradeHref={appRoutes.billing}
                  upgradeLabel={t.upgradeToUnlock}
                  labels={m.itemForm}
                  imagePickerLabels={m.itemImagePicker}
                />
                <div className="md:col-span-2">
                  <Button type="submit">{t.save}</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.currentTitle}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ItemsListScrollAnchor
                editingItemId={editItemId || null}
                updatedNonce={updated ?? null}
                updateErrorNonce={updateError ?? null}
              />
              {categories.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2" role="navigation" aria-label={t.currentTitle}>
                  <Link
                    scroll={false}
                    href={appHref("items", {
                      tab: "products",
                      ...(editItemId ? { editItemId } : {}),
                    })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      !categoryFilterFromUrl
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    {t.inventoryFilterAll}
                  </Link>
                  {categories.map((category) => {
                    const active = categoryFilterFromUrl === category.id;
                    return (
                      <Link
                        key={category.id}
                        scroll={false}
                        href={appHref("items", {
                          tab: "products",
                          categoryId: category.id,
                          ...(editItemId ? { editItemId } : {}),
                        })}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:bg-muted"
                        )}
                      >
                        {categoryOptionLabel(category)}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
              {filteredInventoryItems.length === 0 ? (
                <p className="text-muted-foreground">
                  {!items.length ? t.empty : t.inventoryNoItemsInCategory}
                </p>
              ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredInventoryItems.map((item) => {
                  const primaryImage = item.images[0];
                  return (
                <div
                  key={item.id}
                  id={`item-${item.id}`}
                  className="flex h-full min-w-0 flex-col space-y-2 rounded-xl border border-border bg-card p-3 shadow-sm scroll-mt-4"
                >
                  <div className="space-y-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug">{item.name}</p>
                      {item.description ? (
                        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editItemId === item.id ? (
                        <>
                          <ActionSubmitButton
                            size="sm"
                            variant="outline"
                            form={`update-item-${item.id}`}
                            idleLabel={locale === "es" ? "Guardar" : "Save"}
                            pendingLabel={locale === "es" ? "Guardando..." : "Saving..."}
                          />
                          <Button asChild type="button" size="sm" variant="outline">
                            <Link
                              scroll={false}
                              href={`${appHref("items", { tab: "products", ...persistInventoryCategory })}#item-${item.id}`}
                            >
                              {locale === "es" ? "Cancelar" : "Cancel"}
                            </Link>
                          </Button>
                        </>
                      ) : (
                        <Button asChild type="button" size="sm" variant="outline">
                          <Link
                            scroll={false}
                            href={`${appHref("items", { tab: "products", editItemId: item.id, ...persistInventoryCategory })}#item-${item.id}`}
                          >
                            {locale === "es" ? "Editar" : "Edit"}
                          </Link>
                        </Button>
                      )}
                      <form action={deleteItemAction} className="inline">
                        <input type="hidden" name="itemId" value={item.id} />
                        <ActionSubmitButton
                          size="sm"
                          variant="destructive"
                          idleLabel={t.delete}
                          pendingLabel={locale === "es" ? "Eliminando..." : "Deleting..."}
                          confirmMessage={t.deleteConfirm}
                        />
                      </form>
                    </div>
                  </div>
                  {editItemId === item.id ? (
                    <ItemEditPhotosPanel
                      itemId={item.id}
                      itemName={item.name}
                      images={item.images.map(({ id: imageId, url, alt }) => ({
                        id: imageId,
                        url,
                        alt,
                      }))}
                      photosTitle={t.photosTitle}
                      imageUrlFieldLabel={m.itemForm.imageUrl}
                      addPhotoLabel={t.addPhoto}
                      maxPhotosReachedLabel={t.maxPhotosReached}
                      deletePhotoAria={t.deletePhotoAria}
                      deletePhotoConfirm={t.deletePhotoConfirm}
                      imagePickerLabels={m.itemImagePicker}
                      deleteImageAction={deleteItemImageAction}
                      appendImageAction={appendItemImageAction}
                    />
                  ) : null}
                  {editItemId === item.id ? (
                    <form
                      id={`update-item-${item.id}`}
                      action={updateItemAction}
                      className="grid gap-2 border-t border-border pt-3"
                    >
                      <input type="hidden" name="itemId" value={item.id} />
                      <Input name="name" defaultValue={item.name} />
                      <Input name="description" defaultValue={item.description ?? ""} />
                      <select
                        name="categoryId"
                        aria-label={t.category}
                        defaultValue={item.categoryId}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {categoryOptionLabel(category)}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" name="isFeatured" defaultChecked={item.isFeatured} />
                        {t.featured}
                      </label>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">{m.itemForm.prices}</p>
                        <div className="space-y-2">
                          {item.prices.map((price) => (
                            <div key={price.id} className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
                              <select
                                name="currencyValues"
                                defaultValue={price.currency}
                                aria-label={m.itemForm.currencyPlaceholder}
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                              >
                                {availableCurrencies.map((currency) => (
                                  <option key={currency} value={currency}>
                                    {currency}
                                  </option>
                                ))}
                              </select>
                              <Input
                                name="priceValues"
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                defaultValue={String(price.amount)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      {canUseAllergens ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">{t.allergens}</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {allergens
                              .filter((allergen) => isVisibleAllergen(allergen.code))
                              .map((allergen) => (
                                <label key={`${item.id}-${allergen.code}`} className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    name="allergens"
                                    value={allergen.code}
                                    defaultChecked={item.allergens.some(
                                      (entry) => entry.allergen.code === allergen.code
                                    )}
                                  />
                                  <span>
                                    {allergen.icon ? `${allergen.icon} ` : ""}
                                    {localizeAllergenName(allergen.code, locale, allergen.name)}
                                  </span>
                                </label>
                              ))}
                          </div>
                        </div>
                      ) : null}
                    </form>
                  ) : null}
                  {editItemId !== item.id ? (
                  <div className="flex gap-3">
                    <div className="flex w-[5.25rem] shrink-0 flex-col gap-1">
                      {primaryImage?.url ? (
                        <>
                          {item.images.slice(0, 2).map((img) => (
                            <div
                              key={img.id}
                              className="flex flex-col overflow-hidden rounded-lg border border-border bg-muted"
                            >
                              <div className="relative aspect-square w-full">
                                <Image
                                  src={img.url}
                                  alt={img.alt ?? item.name}
                                  fill
                                  className="object-cover"
                                  sizes="84px"
                                  unoptimized={!shouldOptimizeImageSrc(img.url)}
                                  loading="lazy"
                                />
                              </div>
                              {!shouldOptimizeImageSrc(img.url) ? (
                                <p className="border-t border-amber-500/30 bg-amber-500/10 px-0.5 py-1 text-center text-[7px] font-medium leading-snug text-amber-900 dark:text-amber-200">
                                  {t.compatibleImage}
                                </p>
                              ) : null}
                            </div>
                          ))}
                          {item.images.length > 2 ? (
                            <div className="flex h-7 items-center justify-center rounded-md bg-muted text-center text-[10px] font-medium text-muted-foreground">
                              +{item.images.length - 2} {t.morePhotosSuffix}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed p-1 text-center text-[10px] leading-tight text-muted-foreground">
                          {t.noPhoto}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>
                          {t.category}: {item.category.name}
                        </span>
                        {primaryImage?.url && item.images.length > 1 ? (
                          <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                            {item.images.length}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {item.isFeatured ? <span className="rounded-full border px-1.5 py-0.5">{t.featured}</span> : null}
                        {item.isVegan ? <span className="rounded-full border px-1.5 py-0.5">{t.vegan}</span> : null}
                        {item.isVegetarian ? (
                          <span className="rounded-full border px-1.5 py-0.5">{t.vegetarian}</span>
                        ) : null}
                        {item.isSpicy ? <span className="rounded-full border px-1.5 py-0.5">{t.spicy}</span> : null}
                      </div>
                      {canUseAllergens && item.allergens.length ? (
                        <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                          {item.allergens
                            .filter((entry) => isVisibleAllergen(entry.allergen.code))
                            .map((entry) => (
                              <span key={entry.allergenId} className="rounded-full border px-1.5 py-0.5">
                                {entry.allergen.icon ? `${entry.allergen.icon} ` : ""}
                                {localizeAllergenName(entry.allergen.code, locale, entry.allergen.name)}
                              </span>
                            ))}
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] font-medium text-primary">
                        {item.prices.map((p) => (
                          <span key={p.id}>
                            {p.currency} {String(p.amount)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  ) : null}
                </div>
                  );
                })}
              </div>
              )}
            </CardContent>
          </Card>
      </div>
      ) : null}

      {initialTab === "translations" ? (
      <div className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{translationsT.aiQueueTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">{translationsT.aiQueueDescription}</p>
              <p className="text-xs text-muted-foreground">
                {locale === "es"
                  ? "Consejo: empieza por nombre y descripción de cada producto."
                  : "Tip: start with each item name and description."}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <form action="/api/ai/translate" method="post">
                <Button type="submit">{translationsT.translateNow}</Button>
              </form>
              {!resourceForTranslations ? (
                <p className="text-sm text-muted-foreground">{translationsT.empty}</p>
              ) : !targetLocales.length ? (
                <p className="text-sm text-muted-foreground">
                  {locale === "es"
                    ? "No hay idiomas de destino configurados. Activa al menos un idioma distinto al principal en Ajustes."
                    : "No target languages configured. Enable at least one language different from the default in Settings."}
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex h-10 max-w-full items-center justify-start overflow-x-auto rounded-md bg-muted p-1 text-muted-foreground">
                    {targetLocales.map((targetLocale) => (
                      <Link
                        key={targetLocale}
                        scroll={false}
                        href={appHref("items", { tab: "translations", locale: targetLocale })}
                        className={cn(
                          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
                          defaultLocaleTab === targetLocale
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {targetLocale.toUpperCase()}
                      </Link>
                    ))}
                  </div>
                  {(() => {
                    const targetLocale = defaultLocaleTab;
                    const resourceEntry = translationMap.get(
                      `${targetLocale}:RESOURCE:${resourceForTranslations.id}:name`
                    );
                    const resourceName = resourceEntry?.value ??
                      resourceForTranslations.name;
                    const resourceApproved = resourceEntry?.status === "APPROVED";
                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-card/30 px-3 py-2">
                          <p className="text-xs text-muted-foreground">
                            {locale === "es"
                              ? `Idioma ${targetLocale.toUpperCase()}`
                              : `Locale ${targetLocale.toUpperCase()}`}
                          </p>
                          <form action={acceptAllTranslationsAction}>
                            <input type="hidden" name="locale" value={targetLocale} />
                            <Button type="submit" size="sm" variant="outline">
                              {locale === "es" ? "Aceptar todo" : "Accept all"}
                            </Button>
                          </form>
                        </div>
                        <div className="rounded-md border bg-card/40 p-3">
                          <p className="mb-2 text-xs text-muted-foreground">{translationsT.fieldName}</p>
                          <form action={saveTranslationOverrideAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                            <input type="hidden" name="entityType" value="RESOURCE" />
                            <input type="hidden" name="entityId" value={resourceForTranslations.id} />
                            <input type="hidden" name="locale" value={targetLocale} />
                            <input type="hidden" name="field" value="name" />
                            <input type="hidden" name="sourceHash" value={getSourceHash(resourceForTranslations.name)} />
                            <Input
                              name="value"
                              defaultValue={resourceName}
                              placeholder={translationsT.overridePlaceholder}
                              readOnly={resourceApproved}
                            />
                            <input type="hidden" name="approve" value="1" />
                              <Button type="submit" size="sm" variant="outline" disabled={resourceApproved}>
                              {locale === "es" ? "Aceptar" : "Accept"}
                            </Button>
                          </form>
                          {resourceApproved ? (
                            <form action={markTranslationDraftAction} className="mt-2">
                              <input type="hidden" name="entityType" value="RESOURCE" />
                              <input type="hidden" name="entityId" value={resourceForTranslations.id} />
                              <input type="hidden" name="locale" value={targetLocale} />
                              <input type="hidden" name="field" value="name" />
                              <Button type="submit" size="sm" variant="outline">
                                {locale === "es" ? "Editar" : "Edit"}
                              </Button>
                            </form>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          {resourceForTranslations.menus.flatMap((menu) =>
                            menu.categories
                              .filter((category) => {
                                const isMainCategory = isLegacyMainCategory(category.name);
                                // Hide Main buckets from translation editing UI entirely.
                                return !isMainCategory;
                              })
                              .map((category, categoryIndex) => {
                            const isMainCategory = isLegacyMainCategory(category.name);
                            const categoryEntry = translationMap.get(`${targetLocale}:CATEGORY:${category.id}:name`);
                            const rawCategoryValue = categoryEntry?.value ?? category.name;
                            const categoryValue = isLegacyMainCategory(rawCategoryValue)
                              ? category.name
                              : rawCategoryValue;
                            const categoryApproved = categoryEntry?.status === "APPROVED";
                                const categoryDisplayName =
                                  categoryValue && categoryValue.trim().length > 0 ? categoryValue : category.name;
                                return (
                              <details
                                key={category.id}
                                className="group rounded-md border bg-card/30 px-3 py-2"
                              >
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1 text-sm font-semibold">
                                  <span className="flex min-w-0 items-center gap-2">
                                    <span className="truncate">{categoryDisplayName}</span>
                                    <span className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                      {category.items.length}
                                    </span>
                                  </span>
                                  <span className="text-xs text-muted-foreground transition-transform group-open:rotate-180">
                                    ▼
                                  </span>
                                </summary>
                                <div className="space-y-2 pt-2 text-foreground">
                                {!isMainCategory ? (
                                  <>
                                    <div className="text-xs font-medium text-muted-foreground">
                                      {locale === "es" ? "Categoría" : "Category"}
                                    </div>
                                    <form action={saveTranslationOverrideAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                                      <input type="hidden" name="entityType" value="CATEGORY" />
                                      <input type="hidden" name="entityId" value={category.id} />
                                      <input type="hidden" name="locale" value={targetLocale} />
                                      <input type="hidden" name="field" value="name" />
                                      <input type="hidden" name="sourceHash" value={getSourceHash(category.name)} />
                                      <Input
                                        name="value"
                                        defaultValue={categoryValue}
                                        placeholder={translationsT.overridePlaceholder}
                                        readOnly={categoryApproved}
                                      />
                                      <input type="hidden" name="approve" value="1" />
                                      <Button type="submit" size="sm" variant="outline" disabled={categoryApproved}>
                                        {locale === "es" ? "Aceptar" : "Accept"}
                                      </Button>
                                    </form>
                                    {categoryApproved ? (
                                      <form action={markTranslationDraftAction}>
                                        <input type="hidden" name="entityType" value="CATEGORY" />
                                        <input type="hidden" name="entityId" value={category.id} />
                                        <input type="hidden" name="locale" value={targetLocale} />
                                        <input type="hidden" name="field" value="name" />
                                        <Button type="submit" size="sm" variant="outline">
                                          {locale === "es" ? "Editar" : "Edit"}
                                        </Button>
                                      </form>
                                    ) : null}
                                  </>
                                ) : null}
                                {category.items.map((item) => (
                                  <div key={item.id} className="space-y-2 rounded-md border bg-background/60 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="text-xs font-medium text-muted-foreground">
                                        {locale === "es" ? "Producto" : "Item"}
                                      </div>
                                      <div className="text-xs font-medium">
                                        {item.name}
                                      </div>
                                    </div>
                                    {(() => {
                                      const itemNameEntry = translationMap.get(`${targetLocale}:ITEM:${item.id}:name`);
                                      const itemNameValue = itemNameEntry?.value ?? item.name;
                                      const itemNameApproved = itemNameEntry?.status === "APPROVED";
                                      const itemDescEntry = translationMap.get(`${targetLocale}:ITEM:${item.id}:description`);
                                      const itemDescValue = itemDescEntry?.value ?? (item.description ?? "");
                                      const itemDescApproved = itemDescEntry?.status === "APPROVED";
                                      return (
                                        <>
                                          <form action={saveTranslationOverrideAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                                            <input type="hidden" name="entityType" value="ITEM" />
                                            <input type="hidden" name="entityId" value={item.id} />
                                            <input type="hidden" name="locale" value={targetLocale} />
                                            <input type="hidden" name="field" value="name" />
                                            <input type="hidden" name="sourceHash" value={getSourceHash(item.name)} />
                                            <Input
                                              name="value"
                                              defaultValue={itemNameValue}
                                              placeholder={translationsT.overridePlaceholder}
                                              readOnly={itemNameApproved}
                                            />
                                            <input type="hidden" name="approve" value="1" />
                                            <Button type="submit" size="sm" variant="outline" disabled={itemNameApproved}>
                                              {locale === "es" ? "Aceptar" : "Accept"}
                                            </Button>
                                          </form>
                                          {itemNameApproved ? (
                                            <form action={markTranslationDraftAction}>
                                              <input type="hidden" name="entityType" value="ITEM" />
                                              <input type="hidden" name="entityId" value={item.id} />
                                              <input type="hidden" name="locale" value={targetLocale} />
                                              <input type="hidden" name="field" value="name" />
                                              <Button type="submit" size="sm" variant="outline">
                                                {locale === "es" ? "Editar" : "Edit"}
                                              </Button>
                                            </form>
                                          ) : null}
                                          <form action={saveTranslationOverrideAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                                            <input type="hidden" name="entityType" value="ITEM" />
                                            <input type="hidden" name="entityId" value={item.id} />
                                            <input type="hidden" name="locale" value={targetLocale} />
                                            <input type="hidden" name="field" value="description" />
                                            <input type="hidden" name="sourceHash" value={getSourceHash(item.description ?? "")} />
                                            <Input
                                              name="value"
                                              defaultValue={itemDescValue}
                                              placeholder={translationsT.fieldDescription}
                                              readOnly={itemDescApproved}
                                            />
                                            <input type="hidden" name="approve" value="1" />
                                            <Button type="submit" size="sm" variant="outline" disabled={itemDescApproved}>
                                              {locale === "es" ? "Aceptar" : "Accept"}
                                            </Button>
                                          </form>
                                          {itemDescValue ? (
                                            itemDescApproved ? (
                                              <form action={markTranslationDraftAction}>
                                                <input type="hidden" name="entityType" value="ITEM" />
                                                <input type="hidden" name="entityId" value={item.id} />
                                                <input type="hidden" name="locale" value={targetLocale} />
                                                <input type="hidden" name="field" value="description" />
                                                <Button type="submit" size="sm" variant="outline">
                                                  {locale === "es" ? "Editar" : "Edit"}
                                                </Button>
                                              </form>
                                            ) : null
                                          ) : null}
                                          {item.prices.map((price) => {
                                            if (isDefaultPriceLabel(price.label)) return null;
                                            const priceEntry = translationMap.get(`${targetLocale}:ITEM_PRICE:${price.id}:label`);
                                            const priceLabelValue = priceEntry?.value ?? (price.label ?? "");
                                            const priceApproved = priceEntry?.status === "APPROVED";
                                            return (
                                              <div key={price.id} className="space-y-2 rounded-md border border-border/60 bg-card/20 p-2">
                                                <form action={saveTranslationOverrideAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                                                  <input type="hidden" name="entityType" value="ITEM_PRICE" />
                                                  <input type="hidden" name="entityId" value={price.id} />
                                                  <input type="hidden" name="locale" value={targetLocale} />
                                                  <input type="hidden" name="field" value="label" />
                                                  <input type="hidden" name="sourceHash" value={getSourceHash(price.label ?? "")} />
                                                  <Input
                                                    name="value"
                                                    defaultValue={priceLabelValue}
                                                    placeholder={`${translationsT.fieldPriceLabel} (${price.currency})`}
                                                    readOnly={priceApproved}
                                                  />
                                                  <input type="hidden" name="approve" value="1" />
                                                  <Button type="submit" size="sm" variant="outline" disabled={priceApproved}>
                                                    {locale === "es" ? "Aceptar" : "Accept"}
                                                  </Button>
                                                </form>
                                                {priceApproved ? (
                                                  <form action={markTranslationDraftAction}>
                                                    <input type="hidden" name="entityType" value="ITEM_PRICE" />
                                                    <input type="hidden" name="entityId" value={price.id} />
                                                    <input type="hidden" name="locale" value={targetLocale} />
                                                    <input type="hidden" name="field" value="label" />
                                                    <Button type="submit" size="sm" variant="outline">
                                                      {locale === "es" ? "Editar" : "Edit"}
                                                    </Button>
                                                  </form>
                                                ) : null}
                                              </div>
                                            );
                                          })}
                                        </>
                                      );
                                    })()}
                                  </div>
                                ))}
                                </div>
                              </details>
                            );
                          })
                        )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
      </div>
      ) : null}

      {initialTab === "style-editor" ? (
        <div className="space-y-4 pt-4">
          {menuStylesData ? (
            <MenuStyleEditorPanel
              templatesLabels={templatesT}
              themeControlsLabels={m.themeControls}
              canUseAllTemplates={canUseAllTemplates}
              data={menuStylesData}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {locale === "es"
                ? "No hay un menú activo para editar estilos."
                : "No active menu to edit styles."}
            </p>
          )}
        </div>
      ) : null}

      {initialTab === "mobile-preview" ? (
        <div className="space-y-4 pt-4">
          {menuStylesData ? (
            <MenuStyleMobilePreviewPanel templatesLabels={templatesT} data={menuStylesData} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {locale === "es"
                ? "No hay un menú activo para la vista previa."
                : "No active menu for preview."}
            </p>
          )}
        </div>
      ) : null}

      {initialTab === "qr" ? (
        <div className="space-y-4 pt-4">
          {ctx.resource ? (
            <MenuQrDashboard
              resourceId={ctx.resource.id}
              localeBundle={qrT}
              canBrandQr={canUseQrBranding(ctx.organization.planId)}
              designs={qrDesigns}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {locale === "es" ? "No hay un recurso activo." : "No active resource."}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
