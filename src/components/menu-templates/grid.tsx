"use client";

import { SoldOutBadge } from "@/components/menu-templates/sold-out-badge";
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
    featured: "Recomendados de la casa",
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
    featured: "House favourites",
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
  embedded = false,
}: {
  title: string;
  categories: ReadonlyArray<MenuCategory>;
  locale: string;
  locales?: ReadonlyArray<string>;
  theme?: MenuTheme;
  canShowAllergens?: boolean;
  initialCurrency?: string;
  /** Inside PublicMenuShell: no own header, no card chrome or decorative glows. */
  embedded?: boolean;
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
      className={
        embedded
          ? "relative px-4 pb-4 sm:px-8"
          : "relative overflow-hidden rounded-[28px] border border-[var(--g-border)] p-3 sm:p-4"
      }
      style={
        ({
          backgroundColor: theme?.background ?? "#060b16",
          color: theme?.text ?? "#e6f2ff",
          borderColor: theme?.border ?? "#1f2a44",
          fontFamily: theme?.fontFamily || undefined,
          ["--grid-primary" as string]: theme?.primary ?? "#4cc9ff",
          ["--grid-surface" as string]: theme?.surface ?? "#0e1628",
          // Every color below derives from the venue theme so light themes stay legible.
          ["--g-text" as string]: theme?.text ?? "#e6f2ff",
          ["--g-muted" as string]: `color-mix(in srgb, ${theme?.text ?? "#e6f2ff"} 68%, ${theme?.background ?? "#060b16"})`,
          ["--g-primary" as string]: theme?.primary ?? "#4cc9ff",
          ["--g-surface" as string]: theme?.surface ?? "#0e1628",
          ["--g-border" as string]: theme?.border ?? "#1f2a44",
          ["--g-bg" as string]: theme?.background ?? "#060b16",
        } as CSSProperties)
      }
    >
      {embedded ? null : (
      <header className="relative mb-3 space-y-2 rounded-2xl border border-[var(--g-border)] bg-[var(--g-surface)] p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0 pr-1">
            <div className="mb-1.5">
              <Logo className="text-base text-[var(--g-text)]" />
            </div>
            <h1 className="break-words font-display text-2xl font-bold leading-tight text-[var(--g-text)] sm:text-3xl">{title}</h1>
          </div>
          {locales.length > 1 ? (
            <label className="block w-full max-w-full justify-self-stretch sm:w-auto sm:max-w-[10rem] sm:justify-self-end">
              <span className="sr-only">{ui.language}</span>
              <select
                value={locale}
                onChange={(event) => setUrlState({ localeValue: event.target.value })}
                aria-label={ui.language}
                className="h-9 w-full max-w-full cursor-pointer rounded-xl border border-[var(--g-border)] bg-[var(--g-surface)] py-0 pl-2 pr-8 text-[10px] font-semibold uppercase tracking-wide text-[var(--g-text)] shadow-inner outline-none  focus:border-[var(--g-primary)]/70 focus:ring-2 focus:ring-[var(--g-primary)]"
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
      )}

      {featuredItems.length > 0 && !hasActiveFilters ? (
        <section className="relative mb-4">
          <h2 className="mb-2 px-1 font-display text-lg font-bold tracking-[-0.015em]">{ui.featured}</h2>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {featuredItems.map((item) => {
              const selectedPrice = item.prices.find((price) => price.currency === displayCurrency) ?? item.prices[0];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className="min-w-[200px] rounded-xl border border-[var(--g-border)] bg-[var(--grid-surface)] p-2 text-left shadow-sm outline-none focus-visible:ring-offset-[var(--g-bg)] focus-visible:ring-2 focus-visible:ring-[var(--g-primary)]"
                >
                  <MenuItemMedia
                    image={item.images?.[0] ? { url: item.images[0].url, alt: item.images[0].alt ?? null } : null}
                    itemName={item.name}
                    className="mb-2 aspect-[16/10] w-full rounded-lg object-cover"
                    sizes="(max-width: 640px) 200px, 240px"
                  />
                  <p className="line-clamp-1 text-base font-semibold text-[var(--g-text)]">{item.name}<SoldOutBadge label={item.soldOut} /></p>
                  <p className="mt-1 text-sm font-semibold text-[var(--g-primary)]">
                    {selectedPrice ? formatPrice(Number(selectedPrice.amount), selectedPrice.currency, locale) : "-"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="relative mb-3 space-y-3">
        <div className="rounded-xl border border-dashed border-[var(--g-border)] bg-[var(--g-surface)] p-2.5">
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
                      ? "border-[var(--g-primary)] bg-[color-mix(in_srgb,var(--g-primary)_16%,transparent)] text-[var(--g-text)]"
                      : "border-[var(--g-border)] bg-[var(--g-surface)] text-[var(--g-text)] hover:border-[var(--g-border)] hover:bg-[var(--g-surface)]"
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
                className="h-9 w-full rounded-lg border border-[var(--g-border)] bg-[var(--g-surface)] px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--g-text)] outline-none focus:border-[var(--g-primary)] focus:ring-1 focus:ring-[var(--g-primary)]"
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

          <div className="-mx-1 flex snap-x gap-1 overflow-x-auto border-b border-[var(--g-border)] px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                    "shrink-0 snap-start border-b-2 px-2.5 pb-2.5 pt-1 text-left text-sm font-semibold transition-colors",
                    active
                      ? "border-[var(--g-primary)] text-[var(--g-text)]"
                      : "border-transparent text-[var(--g-muted)] hover:text-[var(--g-text)]"
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
        {activeCategory?.description ? (
          <p className="whitespace-pre-line px-1 text-sm text-[var(--g-muted)]">{activeCategory.description}</p>
        ) : null}
        {visibleItems.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleItems.map((item) => {
              const selectedPrice = item.prices.find((price) => price.currency === displayCurrency) ?? item.prices[0];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className="rounded-2xl border border-[var(--g-border)] bg-[var(--grid-surface)] p-3 text-left shadow-sm outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--g-bg)] focus-visible:ring-2 focus-visible:ring-[var(--g-primary)]"
                >
                  <MenuItemMedia
                    image={item.images?.[0] ? { url: item.images[0].url, alt: item.images[0].alt ?? null } : null}
                    itemName={item.name}
                    className="mb-2 aspect-video w-full rounded-xl object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <h2 className="text-lg font-semibold leading-tight text-[var(--g-text)]">{item.name}<SoldOutBadge label={item.soldOut} /></h2>
                  {item.description ? (
                    <p className="mt-1 text-sm font-medium leading-snug text-[var(--g-text)]/90">{item.description}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.isVegan ? <span className="rounded-full border border-[var(--g-border)] bg-[var(--g-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--g-text)]">{ui.vegan}</span> : null}
                    {item.isVegetarian ? <span className="rounded-full border border-[var(--g-border)] bg-[var(--g-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--g-text)]">{ui.vegetarian}</span> : null}
                    {item.isSpicy ? <span className="rounded-full border border-[var(--g-border)] bg-[var(--g-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--g-text)]">{ui.spicy}</span> : null}
                    {canShowAllergens
                      ? (item.allergens ?? []).map((entry) => (
                          <span key={entry.allergen.id} className="rounded-full border border-[var(--g-border)] bg-[var(--g-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--g-text)]">
                            {localizeAllergenName(entry.allergen.code, locale, entry.allergen.name)}
                          </span>
                        ))
                      : null}
                  </div>
                  <p className="mt-3 inline-block rounded-lg border border-[var(--g-primary)]/55 bg-[color-mix(in_srgb,var(--g-primary)_16%,transparent)] px-2.5 py-1 text-sm font-semibold text-[var(--g-text)]">
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
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--g-border)] bg-[var(--g-surface)] text-[11px] font-semibold uppercase text-[var(--g-text)] "
          >
            <X className="h-3.5 w-3.5" />
            {ui.clearFilters}
          </button>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--g-primary)]/55 bg-[color-mix(in_srgb,var(--g-primary)_16%,transparent)] text-[11px] font-semibold uppercase text-[var(--g-text)] "
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
