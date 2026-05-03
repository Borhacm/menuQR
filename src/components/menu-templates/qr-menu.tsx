"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Flame, Leaf, Sprout } from "lucide-react";
import { formatPrice } from "@/config/currencies";
import { cn } from "@/lib/utils";
import { shouldOptimizeImageSrc } from "@/lib/images";
import { buildVariantUrl } from "@/lib/media-cdn";
import { isVisibleAllergen, localizeAllergenName } from "@/lib/allergens";
import { Logo } from "@/components/marketing/logo";
import type { MenuCategory, MenuTheme } from "@/components/menu-templates/types";
import { EmptyStateCard } from "@/components/menu-templates/qr/empty-state-card";
import { FilterBar, type DietFilterChip, type DietFilterState } from "@/components/menu-templates/qr/filter-bar";
import { CategoryTabs } from "@/components/menu-templates/qr/category-tabs";
import { QuickActionsBar } from "@/components/menu-templates/qr/quick-actions-bar";
import { resolveMenuDisplayCurrency } from "@/lib/menu/resolve-display-currency";
import {
  getMenuItemDetailModalLabels,
  MenuItemDetailModal,
} from "@/components/menu-templates/menu-item-detail-modal";

const uiByLocale: Record<
  string,
  {
    noItems: string;
    featuredOnly: string;
    noResults: string;
    vegan: string;
    vegetarian: string;
    spicy: string;
    excludeAllergen: string;
    noAllergenExclusion: string;
    noItemsHint: string;
    noResultsHint: string;
  }
> = {
  es: {
    noItems: "Sin productos en esta categoría.",
    featuredOnly: "Recomendaciones del chef",
    noResults: "No encontramos resultados para los filtros seleccionados.",
    vegan: "Vegano",
    vegetarian: "Vegetariano",
    spicy: "Picante",
    excludeAllergen: "Excluir alérgeno",
    noAllergenExclusion: "Excluir alérgenos",
    noItemsHint: "Añade más platos para mostrar esta categoría.",
    noResultsHint: "Prueba con otro término o limpia filtros.",
  },
  en: {
    noItems: "No items in this category yet.",
    featuredOnly: "Chef recommendations",
    noResults: "No results found for selected filters.",
    vegan: "Vegan",
    vegetarian: "Vegetarian",
    spicy: "Spicy",
    excludeAllergen: "Exclude allergen",
    noAllergenExclusion: "Exclude allergens",
    noItemsHint: "Add more dishes to populate this category.",
    noResultsHint: "Try another term or clear filters.",
  },
};

function getLocaleUi(locale: string) {
  return uiByLocale[locale] ?? uiByLocale.en;
}

function getLocaleFlag(locale: string) {
  const normalized = locale.toLowerCase();
  if (normalized.startsWith("es")) return "🇪🇸";
  if (normalized.startsWith("en")) return "🇬🇧";
  if (normalized.startsWith("fr")) return "🇫🇷";
  if (normalized.startsWith("nl")) return "🇳🇱";
  if (normalized.startsWith("it")) return "🇮🇹";
  if (normalized.startsWith("de")) return "🇩🇪";
  return "🌐";
}

function getLocaleShort(locale: string) {
  return locale.split("-")[0]?.toUpperCase() ?? locale.toUpperCase();
}

function MenuItemMedia({
  image,
  itemName,
  className,
}: {
  image?: { url: string; alt: string | null } | null;
  itemName: string;
  className: string;
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  if (!image?.url || loadFailed) return null;

  return (
    <Image
      src={shouldOptimizeImageSrc(image.url) ? buildVariantUrl(image.url, 1024, "webp") : image.url}
      alt={image.alt ?? itemName}
      width={640}
      height={360}
      unoptimized={!shouldOptimizeImageSrc(image.url)}
      onError={() => setLoadFailed(true)}
      className={cn("mb-3 rounded-2xl object-cover ring-1 ring-border/60", className)}
      loading="lazy"
    />
  );
}

function parseDietFilters(raw: string | null) {
  const tokens = new Set((raw ?? "").split(",").map((entry) => entry.trim()).filter(Boolean));
  return {
    vegan: tokens.has("vegan"),
    vegetarian: tokens.has("vegetarian"),
    spicy: tokens.has("spicy"),
  };
}

function serializeDietFilters(filters: {
  vegan: boolean;
  vegetarian: boolean;
  spicy: boolean;
}) {
  const values = [
    filters.vegan ? "vegan" : null,
    filters.vegetarian ? "vegetarian" : null,
    filters.spicy ? "spicy" : null,
  ].filter(Boolean);
  return values.join(",");
}

function collectAllergenCodes(categories: ReadonlyArray<MenuCategory>) {
  return Array.from(
    new Set(
      categories.flatMap((category) =>
        category.items.flatMap((item) =>
          (item.allergens ?? [])
            .map((entry) => entry.allergen.code)
            .filter((code): code is string => typeof code === "string" && code.trim().length > 0)
        )
      )
    )
  );
}

export function QrMenuTemplate({
  title,
  locale,
  locales,
  categories,
  theme,
  canShowAllergens = false,
  analytics,
  initialCurrency,
}: {
  title: string;
  locale: string;
  locales: ReadonlyArray<string>;
  categories: ReadonlyArray<MenuCategory>;
  theme?: MenuTheme;
  canShowAllergens?: boolean;
  analytics?: {
    resourceId: string;
    enableItemTracking?: boolean;
  };
  initialCurrency?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    searchParams.get("category") ?? categories[0]?.id ?? ""
  );
  const [hasScrolledDown, setHasScrolledDown] = useState(false);
  const [dietFilters, setDietFilters] = useState(() => parseDietFilters(searchParams.get("diet")));
  const [excludedAllergenCode, setExcludedAllergenCode] = useState(
    searchParams.get("excludeAllergen") ?? ""
  );
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const allCurrencies = useMemo(
    () =>
      Array.from(
        new Set(
          categories.flatMap((category) =>
            category.items.flatMap((item) => item.prices.map((price) => price.currency))
          )
        )
      ),
    [categories]
  );
  const displayCurrency = useMemo(
    () =>
      resolveMenuDisplayCurrency(initialCurrency, searchParams.get("currency"), allCurrencies),
    [initialCurrency, allCurrencies, searchParams]
  );
  const ui = getLocaleUi(locale);
  const detailLabels = useMemo(() => getMenuItemDetailModalLabels(locale), [locale]);
  const detailItem = useMemo(
    () => categories.flatMap((c) => c.items).find((i) => i.id === detailItemId) ?? null,
    [categories, detailItemId]
  );
  const allergenCodes = useMemo(() => collectAllergenCodes(categories), [categories]);
  const viewedItemIdsRef = useRef<Set<string>>(new Set());
  const canTrackItems = Boolean(analytics?.enableItemTracking && analytics.resourceId);
  const firstInteractionAtRef = useRef<number>(Date.now());
  const firstClickTrackedRef = useRef(false);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) ?? categories[0],
    [activeCategoryId, categories]
  );
  const urlSyncStateRef = useRef({
    activeCategoryId,
    excludedAllergenCode,
    dietFilters,
  });
  urlSyncStateRef.current = {
    activeCategoryId,
    excludedAllergenCode,
    dietFilters,
  };
  useEffect(() => {
    const s = urlSyncStateRef.current;
    const categoryFromUrl = searchParams.get("category");
    const excludedAllergenFromUrl = searchParams.get("excludeAllergen") ?? "";
    const dietFromUrl = parseDietFilters(searchParams.get("diet"));
    if (categoryFromUrl && categoryFromUrl !== s.activeCategoryId) setActiveCategoryId(categoryFromUrl);
    if (excludedAllergenFromUrl !== s.excludedAllergenCode) setExcludedAllergenCode(excludedAllergenFromUrl);
    if (JSON.stringify(dietFromUrl) !== JSON.stringify(s.dietFilters)) setDietFilters(dietFromUrl);
  }, [searchParams]);

  function getLocaleHref(nextLocale: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("locale", nextLocale);
    return `${pathname}?${params.toString()}`;
  }

  const setUrlState = useCallback(
    (next: {
      categoryId?: string;
      dietValue?: { vegan: boolean; vegetarian: boolean; spicy: boolean };
      excludedAllergen?: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      const category = next.categoryId ?? activeCategoryId;
      const dietValue = next.dietValue ?? dietFilters;
      const nextExcludedAllergen = next.excludedAllergen ?? excludedAllergenCode;
      if (category) params.set("category", category);
      else params.delete("category");
      params.delete("search");
      params.delete("featured");
      const dietToken = serializeDietFilters(dietValue);
      if (dietToken) params.set("diet", dietToken);
      else params.delete("diet");
      if (nextExcludedAllergen) params.set("excludeAllergen", nextExcludedAllergen);
      else params.delete("excludeAllergen");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [activeCategoryId, dietFilters, excludedAllergenCode, pathname, router, searchParams]
  );

  const matchesActiveFilters = useCallback(
    (item: MenuCategory["items"][number]) => {
      if (dietFilters.vegan && !item.isVegan) return false;
      if (dietFilters.vegetarian && !item.isVegetarian) return false;
      if (dietFilters.spicy && !item.isSpicy) return false;
      if (
        excludedAllergenCode &&
        (item.allergens ?? []).some((entry) => entry.allergen.code === excludedAllergenCode)
      ) {
        return false;
      }
      return true;
    },
    [dietFilters, excludedAllergenCode]
  );

  const visibleItems = useMemo(() => {
    const source = activeCategory?.items ?? [];
    return source.filter(matchesActiveFilters);
  }, [
    activeCategory?.items,
    matchesActiveFilters,
  ]);

  const featuredItems = useMemo(
    () =>
      categories.flatMap((category) =>
        category.items
          .filter((item) => item.isFeatured && matchesActiveFilters(item))
          .map((item) => ({
            ...item,
            categoryId: category.id,
          }))
      ),
    [categories, matchesActiveFilters]
  );
  const showSpicyFilter = dietFilters.spicy || visibleItems.some((item) => item.isSpicy);
  const dietFilterChips: ReadonlyArray<{
    key: "vegan" | "vegetarian" | "spicy";
    label: string;
    icon: typeof Leaf;
  }> = [
    { key: "vegan", label: ui.vegan, icon: Leaf },
    { key: "vegetarian", label: ui.vegetarian, icon: Sprout },
    ...(showSpicyFilter ? [{ key: "spicy" as const, label: ui.spicy, icon: Flame }] : []),
  ];

  const trackItemEvent = useCallback(
    (type: "ITEM_VIEW" | "ITEM_CLICK", itemId: string) => {
      if (!canTrackItems || !analytics?.resourceId) return;
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          resourceId: analytics.resourceId,
          locale,
          type,
          itemId,
        }),
      });
    },
    [analytics?.resourceId, canTrackItems, locale]
  );

  const trackUxEvent = useCallback(
    (uxEvent: string, metadata?: Record<string, string | number | boolean | null>) => {
      if (!analytics?.resourceId) return;
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          resourceId: analytics.resourceId,
          locale,
          type: "VIEW",
          metadata: {
            uxEvent,
            ...metadata,
          },
        }),
      });
    },
    [analytics?.resourceId, locale]
  );

  useEffect(() => {
    if (!canTrackItems) return;
    for (const item of visibleItems) {
      if (viewedItemIdsRef.current.has(item.id)) continue;
      viewedItemIdsRef.current.add(item.id);
      trackItemEvent("ITEM_VIEW", item.id);
    }
  }, [canTrackItems, trackItemEvent, visibleItems]);

  useEffect(() => {
    function onScroll() {
      setHasScrolledDown(window.scrollY > 220);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hasActiveFilters =
    dietFilters.vegan || dietFilters.vegetarian || dietFilters.spicy || Boolean(excludedAllergenCode);
  const showQuickActions = hasActiveFilters || hasScrolledDown;
  const handleToggleDietFilter = useCallback(
    (key: keyof DietFilterState, enabled: boolean) => {
      const next = { ...dietFilters, [key]: enabled };
      setDietFilters(next);
      setUrlState({ dietValue: next });
      trackUxEvent("DIET_FILTER_TOGGLE", { filter: key, enabled });
    },
    [dietFilters, setUrlState, trackUxEvent]
  );
  const handleExcludeAllergenChange = useCallback(
    (nextCode: string) => {
      setExcludedAllergenCode(nextCode);
      setUrlState({ excludedAllergen: nextCode });
      trackUxEvent("ALLERGEN_EXCLUDE_CHANGE", { allergen: nextCode || "none" });
    },
    [setUrlState, trackUxEvent]
  );
  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setActiveCategoryId(categoryId);
      setUrlState({ categoryId });
      trackUxEvent("CATEGORY_CHANGE", { categoryId, source: "category_tabs" });
    },
    [setUrlState, trackUxEvent]
  );
  const handleClearFilters = useCallback(() => {
    const clearedDiet = { vegan: false, vegetarian: false, spicy: false };
    setDietFilters(clearedDiet);
    setExcludedAllergenCode("");
    setUrlState({
      dietValue: clearedDiet,
      excludedAllergen: "",
    });
    trackUxEvent("FILTERS_CLEAR");
  }, [setUrlState, trackUxEvent]);

  return (
    <div
      className="relative overflow-hidden rounded-[30px] border border-border/70 bg-background/95 p-4 shadow-[0_26px_64px_-38px_rgba(0,0,0,0.55)] sm:p-5"
      style={
        theme
          ? ({
              backgroundColor: theme.background,
              color: theme.text,
              borderColor: theme.border,
              fontFamily: theme.fontFamily || undefined,
              ["--menu-primary" as string]: theme.primary,
              ["--menu-surface" as string]: theme.surface,
              ["--menu-border" as string]: theme.border,
            } as CSSProperties)
          : undefined
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,hsl(var(--primary)/0.14),transparent_68%)]" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-16 bg-gradient-to-b from-primary/10 to-transparent" />
      <div className={cn("relative space-y-4.5", theme?.density === "compact" ? "text-sm" : "")}>
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border/70 bg-card/45 p-3 backdrop-blur-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0 pr-1">
            <div className="mb-1">
              <Logo className="text-sm" />
            </div>
            <h1 className="mt-1 break-words font-display text-[1.65rem] font-bold leading-tight sm:text-[2.05rem]">
              {title}
            </h1>
          </div>

          {locales.length > 1 ? (
            <label className="block w-full max-w-full justify-self-stretch sm:w-auto sm:max-w-[10rem] sm:justify-self-end">
              <span className="sr-only">{locale === "es" ? "Idioma" : "Language"}</span>
              <select
                value={locale}
                onChange={(event) => {
                  router.replace(getLocaleHref(event.target.value), { scroll: false });
                }}
                aria-label={locale === "es" ? "Idioma" : "Language"}
                className="h-9 w-full max-w-full cursor-pointer rounded-xl border border-border/80 bg-background py-0 pl-2 pr-8 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-zinc-500/60 dark:bg-zinc-950/90 dark:text-zinc-50"
                style={
                  theme
                    ? {
                        borderColor: theme.border,
                        backgroundColor: theme.surface,
                        color: theme.text,
                      }
                    : undefined
                }
              >
                {locales.map((enabledLocale) => (
                  <option key={enabledLocale} value={enabledLocale}>
                    {getLocaleFlag(enabledLocale)} {getLocaleShort(enabledLocale)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <FilterBar
          showSpicyFilter={showSpicyFilter}
          dietFilterChips={dietFilterChips}
          dietFilters={dietFilters}
          onToggleDietFilter={handleToggleDietFilter}
          ui={ui}
          excludedAllergenCode={excludedAllergenCode}
          onExcludeAllergenChange={handleExcludeAllergenChange}
          allergenCodes={allergenCodes}
          locale={locale}
          theme={theme}
        />

        {featuredItems.length > 0 ? (
          <section className="space-y-2.5">
            <p className="px-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/90">
              {ui.featuredOnly}
            </p>
            <div className="-mx-1.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1.5 pb-1.5">
              {featuredItems.map((item) => {
                const selectedPrice =
                  item.prices.find((price) => price.currency === displayCurrency) ?? item.prices[0] ?? null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setDetailItemId(item.id);
                      trackItemEvent("ITEM_CLICK", item.id);
                    }}
                    className="min-w-[244px] max-w-[244px] snap-start rounded-3xl border border-border/80 bg-card/90 p-2.5 text-left shadow-[0_14px_30px_-24px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-22px_rgba(0,0,0,0.55)] active:scale-[0.99]"
                    style={
                      theme
                        ? {
                            borderColor: theme.border,
                            backgroundColor: theme.surface,
                          }
                        : undefined
                    }
                  >
                    <MenuItemMedia
                      image={item.images?.[0] ? { url: item.images[0].url, alt: item.images[0].alt ?? null } : null}
                      itemName={item.name}
                      className="mb-2 aspect-[16/10] w-full rounded-2xl"
                    />
                    <div className="flex min-h-[2.25rem] items-center justify-between gap-2">
                      <span className="line-clamp-1 text-[1.14rem] font-semibold leading-[1.15] tracking-[-0.008em]">
                        {item.name}
                      </span>
                      <span className="shrink-0 rounded-full border border-border/80 bg-card/60 px-2.5 py-1 text-[12px] font-semibold leading-none text-muted-foreground">
                        {selectedPrice
                          ? formatPrice(Number(selectedPrice.amount), selectedPrice.currency, locale)
                          : "-"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <CategoryTabs
          categories={categories}
          activeCategoryId={activeCategory?.id ?? ""}
          onCategoryChange={handleCategoryChange}
          theme={theme}
        />

        <section className="pb-20">
          <div className="mb-2" role="status" aria-live="polite" />

          <div className="space-y-2.5 sm:space-y-3">
            {visibleItems.length > 0 ? (
              visibleItems.map((item) => {
                const selectedPrice =
                  item.prices.find((price) => price.currency === displayCurrency) ?? item.prices[0] ?? null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setDetailItemId(item.id);
                      trackItemEvent("ITEM_CLICK", item.id);
                      if (!firstClickTrackedRef.current) {
                        firstClickTrackedRef.current = true;
                        trackUxEvent("FIRST_ITEM_CLICK", {
                          msFromOpen: Date.now() - firstInteractionAtRef.current,
                          itemId: item.id,
                        });
                      }
                    }}
                    className="group flex w-full flex-col rounded-[22px] border border-border/80 bg-background/95 p-3 text-left transition-all duration-200 ease-out outline-none hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_20px_38px_-26px_rgba(0,0,0,0.58)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.995] sm:p-3.5"
                    style={
                      theme
                        ? {
                            borderColor: theme.border,
                            backgroundColor: theme.background,
                            ["--tw-ring-offset-color" as string]: theme.background,
                          }
                        : undefined
                    }
                  >
                  <MenuItemMedia
                    image={item.images?.[0] ? { url: item.images[0].url, alt: item.images[0].alt ?? null } : null}
                    itemName={item.name}
                    className="aspect-video w-full"
                  />
                  <div className="flex items-start gap-3">
                    <h3 className="text-[1.22rem] font-semibold leading-[1.2] tracking-[-0.004em] sm:text-[1.28rem]">
                      {item.name}
                    </h3>
                  </div>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-[14.5px] leading-[1.5] text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {item.isVegan ? (
                      <span className="rounded-full border border-border/80 bg-card/60 px-2 py-0.5 text-[11.5px] font-medium leading-none text-muted-foreground">
                        {ui.vegan}
                      </span>
                    ) : null}
                    {item.isVegetarian ? (
                      <span className="rounded-full border border-border/80 bg-card/60 px-2 py-0.5 text-[11.5px] font-medium leading-none text-muted-foreground">
                        {ui.vegetarian}
                      </span>
                    ) : null}
                    {item.isSpicy ? (
                      <span className="rounded-full border border-border/80 bg-card/60 px-2 py-0.5 text-[11.5px] font-medium leading-none text-muted-foreground">
                        {ui.spicy}
                      </span>
                    ) : null}
                    {canShowAllergens
                      ? (item.allergens ?? [])
                          .filter((entry) => isVisibleAllergen(entry.allergen.code))
                          .map((entry) => (
                          <span
                            key={entry.allergen.id}
                            className="rounded-full border border-border/80 bg-card/60 px-2 py-0.5 text-[11.5px] font-medium leading-none text-muted-foreground"
                          >
                            {entry.allergen.icon ? `${entry.allergen.icon} ` : ""}
                            {localizeAllergenName(entry.allergen.code, locale, entry.allergen.name)}
                          </span>
                        ))
                      : null}
                    <span
                      className="ml-auto rounded-full border border-border/80 bg-card/60 px-2 py-0.5 text-[11.5px] font-semibold leading-none text-muted-foreground"
                      style={
                        theme
                          ? {
                              borderColor: theme.border,
                              backgroundColor: theme.surface,
                              color: theme.text,
                            }
                          : undefined
                      }
                    >
                      {selectedPrice
                        ? formatPrice(Number(selectedPrice.amount), selectedPrice.currency, locale)
                        : "-"}
                    </span>
                  </div>
                </button>
                );
              })
            ) : hasActiveFilters ? (
              <EmptyStateCard icon="search" title={ui.noResults} hint={ui.noResultsHint} theme={theme} />
            ) : (
              <EmptyStateCard icon="items" title={ui.noItems} hint={ui.noItemsHint} theme={theme} />
            )}
          </div>
        </section>

        <QuickActionsBar
          show={showQuickActions}
          onClear={handleClearFilters}
          onBackToTop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          locale={locale}
          theme={theme}
        />

        <MenuItemDetailModal
          item={detailItem}
          open={detailItem !== null}
          onClose={() => setDetailItemId(null)}
          locale={locale}
          displayCurrency={displayCurrency}
          canShowAllergens={canShowAllergens}
          labels={detailLabels}
          variant="modern"
          theme={theme}
        />
      </div>
    </div>
  );
}
