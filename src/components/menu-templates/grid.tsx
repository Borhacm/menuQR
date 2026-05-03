"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Flame, Leaf, Sprout, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { formatPrice } from "@/config/currencies";
import { localizeAllergenName } from "@/lib/allergens";
import type { MenuCategory, MenuTheme } from "@/components/menu-templates/types";
import { cn } from "@/lib/utils";
import { EmptyStateCard } from "@/components/menu-templates/qr/empty-state-card";
import { Logo } from "@/components/marketing/logo";
import { shouldOptimizeImageSrc } from "@/lib/images";
import { buildVariantUrl } from "@/lib/media-cdn";
import { resolveMenuDisplayCurrency } from "@/lib/menu/resolve-display-currency";
import {
  getMenuItemDetailModalLabels,
  MenuItemDetailModal,
} from "@/components/menu-templates/menu-item-detail-modal";

type DietFilterState = {
  vegan: boolean;
  vegetarian: boolean;
  spicy: boolean;
};

const uiByLocale: Record<
  string,
  {
    noItems: string;
    noItemsHint: string;
    noResults: string;
    noResultsHint: string;
    clearFilters: string;
    backToTop: string;
    featured: string;
    itemDetails: string;
    close: string;
    vegan: string;
    vegetarian: string;
    spicy: string;
    excludeAllergen: string;
    noAllergenExclusion: string;
    language: string;
    sectionMenu: string;
  }
> = {
  es: {
    noItems: "Sin productos en esta categoría.",
    noItemsHint: "Añade más platos para mostrar esta categoría.",
    noResults: "No encontramos resultados para los filtros seleccionados.",
    noResultsHint: "Prueba con otra combinación de filtros o límpialos.",
    clearFilters: "Limpiar filtros",
    backToTop: "Ir arriba",
    featured: "Recomendados",
    itemDetails: "Producto",
    close: "Cerrar",
    vegan: "Vegano",
    vegetarian: "Vegetariano",
    spicy: "Picante",
    excludeAllergen: "Excluir alérgeno",
    noAllergenExclusion: "Excluir alérgenos",
    language: "Idioma",
    sectionMenu: "Carta",
  },
  en: {
    noItems: "No items in this category yet.",
    noItemsHint: "Add more dishes to populate this category.",
    noResults: "No results found for selected filters.",
    noResultsHint: "Try another filter combination or clear filters.",
    clearFilters: "Clear filters",
    backToTop: "Back to top",
    featured: "Featured",
    itemDetails: "Item",
    close: "Close",
    vegan: "Vegan",
    vegetarian: "Vegetarian",
    spicy: "Spicy",
    excludeAllergen: "Exclude allergen",
    noAllergenExclusion: "Exclude allergens",
    language: "Language",
    sectionMenu: "Menu",
  },
};

function parseDietFilters(raw: string | null): DietFilterState {
  const tokens = new Set((raw ?? "").split(",").map((entry) => entry.trim()).filter(Boolean));
  return {
    vegan: tokens.has("vegan"),
    vegetarian: tokens.has("vegetarian"),
    spicy: tokens.has("spicy"),
  };
}

function serializeDietFilters(filters: DietFilterState): string {
  return (Object.entries(filters) as Array<[keyof DietFilterState, boolean]>)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)
    .join(",");
}

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

function MenuItemMedia({
  image,
  itemName,
  className,
  sizes,
}: {
  image?: { url: string; alt: string | null } | null;
  itemName: string;
  className: string;
  sizes?: string;
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
      className={className}
      sizes={sizes}
      loading="lazy"
    />
  );
}

export function GridTemplate({
  title,
  categories,
  locale,
  locales = [locale],
  theme,
  canShowAllergens = false,
  initialCurrency,
}: {
  title: string;
  categories: ReadonlyArray<MenuCategory>;
  locale: string;
  locales?: ReadonlyArray<string>;
  theme?: MenuTheme;
  canShowAllergens?: boolean;
  initialCurrency?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ui = getLocaleUi(locale);
  const [activeCategoryId, setActiveCategoryId] = useState(searchParams.get("category") ?? categories[0]?.id ?? "");
  const [dietFilters, setDietFilters] = useState(() => parseDietFilters(searchParams.get("diet")));
  const [excludedAllergenCode, setExcludedAllergenCode] = useState(searchParams.get("excludeAllergen") ?? "");
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
  const [hasScrolledDown, setHasScrolledDown] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) ?? categories[0],
    [activeCategoryId, categories]
  );
  const allergenCodes = useMemo(() => collectAllergenCodes(categories), [categories]);
  const featuredItems = useMemo(
    () =>
      categories.flatMap((category) =>
        category.items.filter((item) => item.isFeatured).map((item) => ({ ...item, categoryId: category.id }))
      ),
    [categories]
  );

  useEffect(() => {
    function onScroll() {
      setHasScrolledDown(window.scrollY > 220);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!selectedItemId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedItemId]);

  useEffect(() => {
    if (!categories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(categories[0]?.id ?? "");
    }
  }, [activeCategoryId, categories]);

  const setUrlState = useCallback(
    (next: {
      categoryId?: string;
      dietValue?: DietFilterState;
      excludedAllergen?: string;
      localeValue?: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      const categoryId = next.categoryId ?? activeCategoryId;
      const dietValue = next.dietValue ?? dietFilters;
      const allergenValue = next.excludedAllergen ?? excludedAllergenCode;
      const localeValue = next.localeValue ?? locale;
      if (categoryId) params.set("category", categoryId);
      else params.delete("category");
      params.delete("search");
      const dietToken = serializeDietFilters(dietValue);
      if (dietToken) params.set("diet", dietToken);
      else params.delete("diet");
      if (allergenValue) params.set("excludeAllergen", allergenValue);
      else params.delete("excludeAllergen");
      if (localeValue) params.set("locale", localeValue);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [activeCategoryId, dietFilters, excludedAllergenCode, locale, pathname, router, searchParams]
  );

  const visibleItems = useMemo(() => {
    const source = activeCategory?.items ?? [];
    return source.filter((item) => {
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
    });
  }, [activeCategory?.items, dietFilters, excludedAllergenCode]);

  const hasActiveFilters =
    dietFilters.vegan || dietFilters.vegetarian || dietFilters.spicy || Boolean(excludedAllergenCode);
  const selectedItem = useMemo(
    () => categories.flatMap((category) => category.items).find((item) => item.id === selectedItemId) ?? null,
    [categories, selectedItemId]
  );

  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-white/20 bg-slate-950/90 p-3 shadow-[0_24px_60px_-28px_rgba(56,189,248,0.5)] backdrop-blur-xl sm:p-4"
      style={
        ({
          backgroundColor: theme?.background ?? "#060b16",
          color: theme?.text ?? "#e6f2ff",
          borderColor: theme?.border ?? "#1f2a44",
          fontFamily: theme?.fontFamily || undefined,
          ["--grid-primary" as string]: theme?.primary ?? "#4cc9ff",
          ["--grid-surface" as string]: theme?.surface ?? "#0e1628",
        } as CSSProperties)
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(76,201,255,0.18),transparent_42%)]" />
      <header className="relative mb-3 space-y-2 rounded-2xl border border-white/20 bg-gradient-to-r from-slate-900/95 to-slate-800/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0 pr-1">
            <div className="mb-1.5">
              <Logo className="text-base text-white" />
            </div>
            <h1 className="break-words font-display text-2xl font-bold leading-tight text-white sm:text-3xl">{title}</h1>
          </div>
          {locales.length > 1 ? (
            <label className="block w-full max-w-full justify-self-stretch sm:w-auto sm:max-w-[10rem] sm:justify-self-end">
              <span className="sr-only">{ui.language}</span>
              <select
                value={locale}
                onChange={(event) => setUrlState({ localeValue: event.target.value })}
                aria-label={ui.language}
                className="h-9 w-full max-w-full cursor-pointer rounded-xl border border-white/40 bg-slate-950/85 py-0 pl-2 pr-8 text-[10px] font-semibold uppercase tracking-wide text-white shadow-inner outline-none backdrop-blur focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-400/25"
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
      </header>

      {featuredItems.length > 0 && !hasActiveFilters ? (
        <section className="relative mb-3 rounded-2xl border border-white/20 bg-slate-900/75 p-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">{ui.featured}</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {featuredItems.map((item) => {
              const selectedPrice = item.prices.find((price) => price.currency === displayCurrency) ?? item.prices[0];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className="min-w-[200px] rounded-xl border border-cyan-300/25 bg-[var(--grid-surface)] p-2 text-left shadow-[0_12px_30px_-18px_rgba(56,189,248,0.6)] outline-none ring-offset-slate-950 focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                >
                  <MenuItemMedia
                    image={item.images?.[0] ? { url: item.images[0].url, alt: item.images[0].alt ?? null } : null}
                    itemName={item.name}
                    className="mb-2 aspect-[16/10] w-full rounded-lg object-cover"
                    sizes="(max-width: 640px) 200px, 240px"
                  />
                  <p className="line-clamp-1 text-base font-semibold text-white">{item.name}</p>
                  <p className="mt-1 text-sm font-semibold text-cyan-200">
                    {selectedPrice ? formatPrice(Number(selectedPrice.amount), selectedPrice.currency, locale) : "-"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="relative mb-3 space-y-3">
        <div className="rounded-xl border border-dashed border-white/25 bg-slate-950/55 p-2.5">
          <div className="flex flex-wrap items-stretch gap-2">
            {([
              { key: "vegan", label: ui.vegan, icon: Leaf },
              { key: "vegetarian", label: ui.vegetarian, icon: Sprout },
              { key: "spicy", label: ui.spicy, icon: Flame },
            ] as const).map((chip) => {
              const enabled = dietFilters[chip.key];
              const Icon = chip.icon;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    const next = { ...dietFilters, [chip.key]: !enabled };
                    setDietFilters(next);
                    setUrlState({ dietValue: next });
                  }}
                  className={cn(
                    "inline-flex min-h-9 min-w-0 flex-1 basis-[calc(50%-0.25rem)] items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[9px] font-semibold uppercase leading-tight tracking-wide transition-colors sm:max-w-[9.25rem] sm:basis-auto sm:text-[10px]",
                    enabled
                      ? "border-cyan-400/55 bg-cyan-500/20 text-cyan-50"
                      : "border-white/30 bg-slate-950/70 text-slate-100 hover:border-white/45 hover:bg-slate-900/80"
                  )}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="min-w-0 truncate text-center">{chip.label}</span>
                </button>
              );
            })}

            <label className="relative block min-h-9 min-w-0 w-full flex-[1_1_100%] sm:max-w-[14rem] sm:flex-[1_1_auto]">
              <span className="sr-only">{ui.excludeAllergen}</span>
              <select
                value={excludedAllergenCode}
                onChange={(event) => {
                  setExcludedAllergenCode(event.target.value);
                  setUrlState({ excludedAllergen: event.target.value });
                }}
                className="h-9 w-full rounded-lg border border-white/35 bg-slate-950/90 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-50 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30"
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
        </div>

        <div>
          <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">
            {ui.sectionMenu}
          </p>
          <div className="-mx-1 flex snap-x gap-1 overflow-x-auto border-b border-white/10 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => {
              const active = category.id === activeCategory?.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCategoryId(category.id);
                    setUrlState({ categoryId: category.id });
                  }}
                  className={cn(
                    "shrink-0 snap-start border-b-2 px-2.5 pb-2.5 pt-1 text-left text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors",
                    active
                      ? "border-cyan-300 text-cyan-100"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                  style={
                    theme && active
                      ? {
                          borderBottomColor: theme.primary,
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
        </div>
      </section>

      <section className="space-y-2 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
        {visibleItems.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleItems.map((item) => {
              const selectedPrice = item.prices.find((price) => price.currency === displayCurrency) ?? item.prices[0];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className="rounded-2xl border border-white/20 bg-[var(--grid-surface)] p-3 text-left shadow-[0_16px_36px_-22px_rgba(59,130,246,0.45)] outline-none ring-offset-2 ring-offset-slate-950 focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                >
                  <MenuItemMedia
                    image={item.images?.[0] ? { url: item.images[0].url, alt: item.images[0].alt ?? null } : null}
                    itemName={item.name}
                    className="mb-2 aspect-video w-full rounded-xl object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <h2 className="text-lg font-semibold leading-tight text-white">{item.name}</h2>
                  {item.description ? (
                    <p className="mt-1 text-sm font-medium leading-snug text-slate-100/90">{item.description}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.isVegan ? <span className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-200">{ui.vegan}</span> : null}
                    {item.isVegetarian ? <span className="rounded-full border border-lime-300/35 bg-lime-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-lime-200">{ui.vegetarian}</span> : null}
                    {item.isSpicy ? <span className="rounded-full border border-rose-300/35 bg-rose-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-200">{ui.spicy}</span> : null}
                    {canShowAllergens
                      ? (item.allergens ?? []).map((entry) => (
                          <span key={entry.allergen.id} className="rounded-full border border-white/25 bg-slate-800/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-200">
                            {localizeAllergenName(entry.allergen.code, locale, entry.allergen.name)}
                          </span>
                        ))
                      : null}
                  </div>
                  <p className="mt-3 inline-block rounded-lg border border-cyan-300/55 bg-cyan-400/20 px-2.5 py-1 text-sm font-semibold text-cyan-100">
                    {selectedPrice ? formatPrice(Number(selectedPrice.amount), selectedPrice.currency, locale) : "-"}
                  </p>
                </button>
              );
            })}
          </div>
        ) : hasActiveFilters ? (
          <EmptyStateCard icon="search" title={ui.noResults} hint={ui.noResultsHint} theme={theme} variant="grid" />
        ) : (
          <EmptyStateCard icon="items" title={ui.noItems} hint={ui.noItemsHint} theme={theme} variant="grid" />
        )}
      </section>

      {(hasActiveFilters || hasScrolledDown) ? (
        <div className="sticky bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-20 grid grid-cols-2 gap-2 pb-[env(safe-area-inset-bottom)]">
          <button
            type="button"
            onClick={() => {
              const clearedDiet: DietFilterState = {
                vegan: false,
                vegetarian: false,
                spicy: false,
              };
              setDietFilters(clearedDiet);
              setExcludedAllergenCode("");
              setUrlState({
                dietValue: clearedDiet,
                excludedAllergen: "",
              });
            }}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-slate-900/90 text-[11px] font-semibold uppercase text-slate-100 backdrop-blur"
          >
            <X className="h-3.5 w-3.5" />
            {ui.clearFilters}
          </button>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-300/55 bg-cyan-400/20 text-[11px] font-semibold uppercase text-cyan-100 backdrop-blur"
          >
            {ui.backToTop}
          </button>
        </div>
      ) : null}

      <MenuItemDetailModal
        item={selectedItem}
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItemId(null)}
        locale={locale}
        displayCurrency={displayCurrency}
        canShowAllergens={canShowAllergens}
        labels={getMenuItemDetailModalLabels(locale)}
        variant="grid"
      />
    </div>
  );
}
