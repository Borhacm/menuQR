"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowUp, Flame, ImageOff, Leaf, Search, SearchX, Sprout, X } from "lucide-react";
import { formatPrice } from "@/config/currencies";
import { cn } from "@/lib/utils";
import { shouldOptimizeImageSrc } from "@/lib/images";
import { buildVariantUrl } from "@/lib/media-cdn";
import { isVisibleAllergen, localizeAllergenName } from "@/lib/allergens";
import { Logo } from "@/components/marketing/logo";
import type { MenuCategory, MenuTheme } from "@/components/menu-templates/types";

const uiByLocale: Record<
  string,
  {
    menu: string;
    mostSold: string;
    noItems: string;
    featuredOnly: string;
    allItems: string;
    searchPlaceholder: string;
    noResults: string;
    categories: string;
    searchTitle: string;
    searchAction: string;
    quickActions: string;
    backToTop: string;
    vegan: string;
    vegetarian: string;
    glutenFree: string;
    spicy: string;
    excludeAllergen: string;
    noAllergenExclusion: string;
    noItemsHint: string;
    noResultsHint: string;
  }
> = {
  es: {
    menu: "MENÚ QR",
    mostSold: "RECOMENDACIÓN DEL CHEF",
    noItems: "Sin productos en esta categoría.",
    featuredOnly: "Recomendaciones del chef",
    allItems: "Todos",
    searchPlaceholder: "Buscar plato o ingrediente",
    noResults: "No encontramos resultados para tu búsqueda.",
    categories: "Categorías",
    searchTitle: "Buscar en el menú",
    searchAction: "Buscar",
    quickActions: "Acciones rápidas",
    backToTop: "Subir",
    vegan: "Vegano",
    vegetarian: "Vegetariano",
    glutenFree: "Sin gluten",
    spicy: "Picante",
    excludeAllergen: "Excluir alérgeno",
    noAllergenExclusion: "Excluir alérgenos",
    noItemsHint: "Añade más platos para mostrar esta categoría.",
    noResultsHint: "Prueba con otro término o limpia filtros.",
  },
  en: {
    menu: "QR MENU",
    mostSold: "CHEF RECOMMENDATION",
    noItems: "No items in this category yet.",
    featuredOnly: "Chef recommendations",
    allItems: "All",
    searchPlaceholder: "Search dish or ingredient",
    noResults: "No results found for your search.",
    categories: "Categories",
    searchTitle: "Search menu",
    searchAction: "Search",
    quickActions: "Quick actions",
    backToTop: "Top",
    vegan: "Vegan",
    vegetarian: "Vegetarian",
    glutenFree: "Gluten free",
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
    glutenFree: tokens.has("glutenFree"),
    spicy: tokens.has("spicy"),
  };
}

function serializeDietFilters(filters: {
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  spicy: boolean;
}) {
  const values = [
    filters.vegan ? "vegan" : null,
    filters.vegetarian ? "vegetarian" : null,
    filters.glutenFree ? "glutenFree" : null,
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
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [hasScrolledDown, setHasScrolledDown] = useState(false);
  const [dietFilters, setDietFilters] = useState(() => parseDietFilters(searchParams.get("diet")));
  const [excludedAllergenCode, setExcludedAllergenCode] = useState(
    searchParams.get("excludeAllergen") ?? ""
  );
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
  const [activeCurrency, setActiveCurrency] = useState(
    searchParams.get("currency") ?? initialCurrency ?? allCurrencies[0] ?? "EUR"
  );
  const ui = getLocaleUi(locale);
  const allergenCodes = useMemo(() => collectAllergenCodes(categories), [categories]);
  const viewedItemIdsRef = useRef<Set<string>>(new Set());
  const canTrackItems = Boolean(analytics?.enableItemTracking && analytics.resourceId);
  const firstInteractionAtRef = useRef<number>(Date.now());
  const firstClickTrackedRef = useRef(false);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) ?? categories[0],
    [activeCategoryId, categories]
  );
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const searchFromUrl = searchParams.get("search");
    const currencyFromUrl = searchParams.get("currency");
    const excludedAllergenFromUrl = searchParams.get("excludeAllergen") ?? "";
    const dietFromUrl = parseDietFilters(searchParams.get("diet"));
    if (categoryFromUrl && categoryFromUrl !== activeCategoryId) setActiveCategoryId(categoryFromUrl);
    if ((searchFromUrl ?? "") !== search) setSearch(searchFromUrl ?? "");
    if (currencyFromUrl && currencyFromUrl !== activeCurrency) setActiveCurrency(currencyFromUrl);
    if (excludedAllergenFromUrl !== excludedAllergenCode) setExcludedAllergenCode(excludedAllergenFromUrl);
    if (JSON.stringify(dietFromUrl) !== JSON.stringify(dietFilters)) setDietFilters(dietFromUrl);
  }, [searchParams]); // Intentional URL-driven sync for back/forward navigation.

  function getLocaleHref(nextLocale: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("locale", nextLocale);
    return `${pathname}?${params.toString()}`;
  }

  function setUrlState(next: {
    categoryId?: string;
    searchValue?: string;
    currencyValue?: string;
    dietValue?: { vegan: boolean; vegetarian: boolean; glutenFree: boolean; spicy: boolean };
    excludedAllergen?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const category = next.categoryId ?? activeCategoryId;
    const searchValue = next.searchValue ?? search;
    const currencyValue = next.currencyValue ?? activeCurrency;
    const dietValue = next.dietValue ?? dietFilters;
    const nextExcludedAllergen = next.excludedAllergen ?? excludedAllergenCode;
    if (category) params.set("category", category);
    else params.delete("category");
    if (searchValue.trim()) params.set("search", searchValue.trim());
    else params.delete("search");
    params.delete("featured");
    if (currencyValue) params.set("currency", currencyValue);
    else params.delete("currency");
    const dietToken = serializeDietFilters(dietValue);
    if (dietToken) params.set("diet", dietToken);
    else params.delete("diet");
    if (nextExcludedAllergen) params.set("excludeAllergen", nextExcludedAllergen);
    else params.delete("excludeAllergen");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const normalizedSearch = search.trim().toLowerCase();

  const matchesActiveFilters = useCallback(
    (item: MenuCategory["items"][number]) => {
      if (dietFilters.vegan && !item.isVegan) return false;
      if (dietFilters.vegetarian && !item.isVegetarian) return false;
      if (dietFilters.glutenFree && !item.isGlutenFree) return false;
      if (dietFilters.spicy && !item.isSpicy) return false;
      if (
        excludedAllergenCode &&
        (item.allergens ?? []).some((entry) => entry.allergen.code === excludedAllergenCode)
      ) {
        return false;
      }
      if (!normalizedSearch) return true;
      const allergenNames = (item.allergens ?? [])
        .map((entry) => localizeAllergenName(entry.allergen.code, locale, entry.allergen.name).toLowerCase())
        .join(" ");
      const tags = [
        item.isVegan ? ui.vegan.toLowerCase() : "",
        item.isVegetarian ? ui.vegetarian.toLowerCase() : "",
        item.isGlutenFree ? ui.glutenFree.toLowerCase() : "",
        item.isSpicy ? ui.spicy.toLowerCase() : "",
      ].join(" ");

      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description?.toLowerCase().includes(normalizedSearch) ||
        allergenNames.includes(normalizedSearch) ||
        tags.includes(normalizedSearch)
      );
    },
    [
      dietFilters,
      excludedAllergenCode,
      locale,
      normalizedSearch,
      ui.glutenFree,
      ui.spicy,
      ui.vegan,
      ui.vegetarian,
    ]
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
    if (!search.trim()) return;
    const timeout = setTimeout(() => {
      trackUxEvent("SEARCH", { query: search.trim(), results: visibleItems.length });
      if (visibleItems.length === 0) {
        trackUxEvent("SEARCH_NO_RESULTS", { query: search.trim() });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [search, trackUxEvent, visibleItems.length]);

  useEffect(() => {
    if (!isSearchModalOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSearchModalOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSearchModalOpen]);

  useEffect(() => {
    function onScroll() {
      setHasScrolledDown(window.scrollY > 220);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    dietFilters.vegan ||
    dietFilters.vegetarian ||
    dietFilters.glutenFree ||
    dietFilters.spicy ||
    Boolean(excludedAllergenCode);
  const showQuickActions = hasActiveFilters || hasScrolledDown;

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
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/45 p-3 backdrop-blur-sm">
          <div>
            <div className="mb-1">
              <Logo className="text-sm" />
            </div>
            <h1 className="mt-1 font-display text-[2rem] font-bold leading-none sm:text-[2.2rem]">{title}</h1>
          </div>

          <div className="flex flex-col items-end gap-2">
            {locales.length > 1 ? (
              <label className="block w-[88px]">
                <span className="sr-only">{locale === "es" ? "Idioma" : "Language"}</span>
                <select
                  value={locale}
                  onChange={(event) => {
                    router.replace(getLocaleHref(event.target.value), { scroll: false });
                  }}
                  aria-label={locale === "es" ? "Idioma" : "Language"}
                  className="h-9 w-full rounded-xl border border-border bg-card/80 px-2 text-[11px] font-semibold uppercase outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
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
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              aria-label={ui.searchAction}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/80 text-muted-foreground transition-all duration-200 hover:text-foreground"
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
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="sticky top-2 z-10 space-y-2">
          {(() => {
            const showSpicy = dietFilters.spicy || visibleItems.some((item) => item.isSpicy);
            const chips: Array<{ key: "vegan" | "vegetarian" | "spicy"; label: string; icon: typeof Leaf }> = [
              { key: "vegan", label: ui.vegan, icon: Leaf },
              { key: "vegetarian", label: ui.vegetarian, icon: Sprout },
              ...(showSpicy ? [{ key: "spicy" as const, label: ui.spicy, icon: Flame }] : []),
            ];
            return (
              <div className={cn("grid gap-2", showSpicy ? "grid-cols-4" : "grid-cols-3")}>
                {chips.map((chip) => {
              const enabled = dietFilters[chip.key as keyof typeof dietFilters];
              const ChipIcon = chip.icon;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    const next = { ...dietFilters, [chip.key]: !enabled };
                    setDietFilters(next);
                    setUrlState({ dietValue: next });
                    trackUxEvent("DIET_FILTER_TOGGLE", { filter: chip.key, enabled: !enabled });
                  }}
                  className={cn(
                    "inline-flex min-h-9 w-full items-center justify-center rounded-full border px-2.5 text-[11px] font-medium transition-all duration-200 ease-out active:scale-[0.98]",
                    enabled
                      ? chip.key === "spicy"
                        ? "border-rose-300/70 bg-rose-500/12 text-rose-700 dark:border-rose-400/40 dark:text-rose-300"
                        : "border-primary/40 bg-primary/12 text-primary"
                      : "border-border bg-card/70 text-muted-foreground hover:border-primary/25"
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ChipIcon className="h-3.5 w-3.5" />
                    {chip.label}
                  </span>
                </button>
              );
            })}
            <label className="relative">
              <span className="sr-only">{ui.excludeAllergen}</span>
              <select
                value={excludedAllergenCode}
                onChange={(event) => {
                  const nextCode = event.target.value;
                  setExcludedAllergenCode(nextCode);
                  setUrlState({ excludedAllergen: nextCode });
                  trackUxEvent("ALLERGEN_EXCLUDE_CHANGE", { allergen: nextCode || "none" });
                }}
                className="min-h-9 w-full rounded-full border border-border bg-card/70 px-2.5 text-[11px] font-medium text-muted-foreground outline-none transition-all duration-200 ease-out focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                <option value="">{ui.noAllergenExclusion}</option>
                {allergenCodes.map((code) => (
                  <option key={code} value={code}>
                    {localizeAllergenName(code, locale, code)}
                  </option>
                ))}
              </select>
            </label>
              </div>
            );
          })()}
          {allCurrencies.length > 1 ? (
            <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-0.5">
              {allCurrencies.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  onClick={() => {
                    setActiveCurrency(currency);
                    setUrlState({ currencyValue: currency });
                    trackUxEvent("CURRENCY_CHANGE", { currency });
                  }}
                  className={cn(
                    "min-h-8.5 shrink-0 rounded-full border px-2.5 text-[11px] font-medium transition-all duration-200 ease-out active:scale-[0.98]",
                    activeCurrency === currency
                      ? "border-primary/40 bg-primary/12 text-primary"
                      : "border-border bg-card/70 text-muted-foreground hover:border-primary/25"
                  )}
                >
                  {currency}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {featuredItems.length > 0 ? (
          <section className="space-y-2.5">
            <p className="px-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/90">
              {ui.featuredOnly}
            </p>
            <div className="-mx-1.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1.5 pb-1.5">
              {featuredItems.map((item) => {
                const selectedPrice =
                  item.prices.find((price) => price.currency === activeCurrency) ?? item.prices[0] ?? null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveCategoryId(item.categoryId);
                      setUrlState({ categoryId: item.categoryId });
                      trackUxEvent("CATEGORY_CHANGE", { categoryId: item.categoryId, source: "featured_carousel" });
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

        {isSearchModalOpen ? (
          <div
            className="absolute inset-0 z-30 bg-black/25"
            onClick={() => setIsSearchModalOpen(false)}
          >
            <div
              className="absolute left-3 right-3 top-[88px] rounded-xl border border-border bg-background/98 p-2.5 shadow-[0_18px_36px_-22px_rgba(0,0,0,0.75)] backdrop-blur"
              style={theme ? { borderColor: theme.border, backgroundColor: theme.background } : undefined}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {ui.searchTitle}
                </p>
                <button
                  type="button"
                  onClick={() => setIsSearchModalOpen(false)}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label={locale === "es" ? "Cerrar" : "Close"}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => {
                    const nextSearch = event.target.value;
                    setSearch(nextSearch);
                    setUrlState({ searchValue: nextSearch });
                  }}
                  placeholder={ui.searchPlaceholder}
                  aria-label={ui.searchPlaceholder}
                  className="h-10 w-full rounded-lg border border-border bg-card/80 pl-9 pr-9 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
                  style={
                    theme
                      ? {
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                          color: theme.text,
                        }
                      : undefined
                  }
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setUrlState({ searchValue: "" });
                      trackUxEvent("SEARCH_CLEAR");
                    }}
                    aria-label={locale === "es" ? "Limpiar búsqueda" : "Clear search"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </label>
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            "mb-3 grid gap-2.5",
            categories.length <= 3 ? "grid-cols-3" : "grid-cols-2"
          )}
        >
          {categories.map((category) => {
            const isActive = (activeCategory?.id ?? "") === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setActiveCategoryId(category.id);
                  setUrlState({ categoryId: category.id });
                  trackUxEvent("CATEGORY_CHANGE", { categoryId: category.id, source: "category_tabs" });
                }}
                className={cn(
                  "min-h-9 rounded-2xl border px-3 text-[13px] font-semibold transition-all duration-200 ease-out active:scale-[0.98]",
                  "w-full whitespace-nowrap",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_12px_20px_-15px_hsl(var(--primary)/0.85)]"
                    : "border-border/90 bg-card/55 text-muted-foreground hover:border-primary/25 hover:bg-card/85 hover:text-foreground"
                )}
                style={
                  theme
                    ? isActive
                      ? {
                          borderColor: theme.primary,
                          backgroundColor: theme.primary,
                          color: theme.background,
                        }
                      : {
                          borderColor: theme.border,
                          backgroundColor: `${theme.surface}CC`,
                          color: theme.text,
                        }
                    : undefined
                }
              >
                {category.name}
              </button>
            );
          })}
        </div>

        <section className="pb-20">
          <div className="mb-2" role="status" aria-live="polite" />

          <div className="space-y-2.5 sm:space-y-3">
            {visibleItems.length > 0 ? (
              visibleItems.map((item) => {
                const selectedPrice =
                  item.prices.find((price) => price.currency === activeCurrency) ?? item.prices[0] ?? null;
                return (
                  <article
                    key={item.id}
                    onClick={() => {
                      trackItemEvent("ITEM_CLICK", item.id);
                      if (!firstClickTrackedRef.current) {
                        firstClickTrackedRef.current = true;
                        trackUxEvent("FIRST_ITEM_CLICK", {
                          msFromOpen: Date.now() - firstInteractionAtRef.current,
                          itemId: item.id,
                        });
                      }
                    }}
                    className="group flex flex-col rounded-[22px] border border-border/80 bg-background/95 p-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_20px_38px_-26px_rgba(0,0,0,0.58)] active:scale-[0.995] sm:p-3.5"
                    style={
                      theme
                        ? {
                            borderColor: theme.border,
                            backgroundColor: theme.background,
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
                    {item.isGlutenFree ? (
                      <span className="rounded-full border border-border/80 bg-card/60 px-2 py-0.5 text-[11.5px] font-medium leading-none text-muted-foreground">
                        {ui.glutenFree}
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
                </article>
                );
              })
            ) : search ? (
              <div
                className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-4 text-center"
                style={theme ? { borderColor: theme.border, backgroundColor: `${theme.surface}99` } : undefined}
              >
                <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/80">
                  <SearchX className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">{ui.noResults}</p>
                <p className="mt-1 text-xs text-muted-foreground">{ui.noResultsHint}</p>
              </div>
            ) : (
              <div
                className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-4 text-center"
                style={theme ? { borderColor: theme.border, backgroundColor: `${theme.surface}99` } : undefined}
              >
                <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/80">
                  <ImageOff className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">{ui.noItems}</p>
                <p className="mt-1 text-xs text-muted-foreground">{ui.noItemsHint}</p>
              </div>
            )}
          </div>
        </section>

        {showQuickActions ? (
          <div className="sticky bottom-2 z-20 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                const clearedDiet = { vegan: false, vegetarian: false, glutenFree: false, spicy: false };
                setDietFilters(clearedDiet);
                setExcludedAllergenCode("");
                setUrlState({
                  searchValue: "",
                  dietValue: clearedDiet,
                  excludedAllergen: "",
                });
                trackUxEvent("FILTERS_CLEAR");
              }}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card/65 px-2.5 text-[12px] font-semibold text-muted-foreground transition-all duration-200 ease-out hover:text-foreground active:scale-[0.98]"
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
              <X className="h-3.5 w-3.5" />
              {locale === "es" ? "Limpiar filtros" : "Clear filters"}
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card/65 px-2.5 text-[12px] font-semibold text-muted-foreground transition-all duration-200 ease-out hover:text-foreground active:scale-[0.98]"
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
              <ArrowUp className="h-3.5 w-3.5" />
              {locale === "es" ? "Ir arriba" : "Back to top"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
