"use client";

import { SoldOutBadge } from "@/components/menu-templates/sold-out-badge";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type CSSProperties } from "react";
import { Flame, Leaf, Sprout, Star } from "lucide-react";
import { formatPrice } from "@/config/currencies";
import { isVisibleAllergen, localizeAllergenName } from "@/lib/allergens";
import { shouldOptimizeImageSrc } from "@/lib/images";
import { buildVariantUrl } from "@/lib/media-cdn";
import { resolveMenuDisplayCurrency } from "@/lib/menu/resolve-display-currency";
import { Logo } from "@/components/marketing/logo";
import {
  getMenuItemDetailModalLabels,
  MenuItemDetailModal,
} from "@/components/menu-templates/menu-item-detail-modal";
import { cn } from "@/lib/utils";
import type { MenuCategory, MenuItem, MenuTheme } from "@/components/menu-templates/types";

const uiByLocale: Record<
  string,
  {
    language: string;
    featuredSection: string;
    recommended: string;
    allergens: string;
    vegan: string;
    vegetarian: string;
    spicy: string;
  }
> = {
  es: {
    language: "Idioma",
    featuredSection: "Recomendados de la casa",
    recommended: "Recomendado",
    allergens: "Alérgenos",
    vegan: "Vegano",
    vegetarian: "Vegetariano",
    spicy: "Picante",
  },
  en: {
    language: "Language",
    featuredSection: "House favourites",
    recommended: "Recommended",
    allergens: "Allergens",
    vegan: "Vegan",
    vegetarian: "Vegetarian",
    spicy: "Spicy",
  },
};

function getUi(locale: string) {
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

function collectAllCurrencies(categories: ReadonlyArray<MenuCategory>) {
  return Array.from(
    new Set(
      categories.flatMap((category) =>
        category.items.flatMap((item) => item.prices.map((price) => price.currency))
      )
    )
  );
}

function formatItemPriceRow(item: MenuItem, displayCurrency: string, locale: string) {
  const primary = item.prices.find((p) => p.currency === displayCurrency) ?? item.prices[0] ?? null;
  const rest = primary ? item.prices.filter((p) => p.id !== primary.id) : item.prices;
  const primaryLabel = primary
    ? formatPrice(Number(primary.amount), primary.currency, locale)
    : null;
  const restLabels = rest.map((p) => formatPrice(Number(p.amount), p.currency, locale)).filter(Boolean);
  return { primaryLabel, restLabels };
}

function ItemThumbnail({
  image,
  itemName,
  compact,
}: {
  image?: { url: string; alt: string | null } | null;
  itemName: string;
  compact: boolean;
}) {
  if (!image?.url) return null;
  const size = compact ? 44 : 52;
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md border border-border/35 bg-muted/20",
        compact ? "h-11 w-11" : "h-[3.25rem] w-[3.25rem]"
      )}
    >
      <Image
        src={shouldOptimizeImageSrc(image.url) ? buildVariantUrl(image.url, 256, "webp") : image.url}
        alt={image.alt ?? itemName}
        width={size}
        height={size}
        unoptimized={!shouldOptimizeImageSrc(image.url)}
        className="h-full w-full object-cover"
        sizes={compact ? "44px" : "52px"}
        loading="lazy"
      />
    </div>
  );
}

function mutedFrom(theme?: MenuTheme) {
  return theme ? `color-mix(in srgb, ${theme.text} 68%, ${theme.background})` : undefined;
}

function ClassicDishRow({
  item,
  locale,
  displayCurrency,
  canShowAllergens,
  ui,
  compact,
  showFeaturedMark,
  theme,
  onOpenDetail,
}: {
  item: MenuItem;
  locale: string;
  displayCurrency: string;
  canShowAllergens: boolean;
  ui: ReturnType<typeof getUi>;
  compact: boolean;
  showFeaturedMark: boolean;
  theme?: MenuTheme;
  onOpenDetail: (itemId: string) => void;
}) {
  const thumb = item.images?.[0];
  const { primaryLabel, restLabels } = formatItemPriceRow(item, displayCurrency, locale);
  const diet = [
    item.isVegan ? { key: "vegan", label: ui.vegan, Icon: Leaf } : null,
    item.isVegetarian && !item.isVegan ? { key: "veg", label: ui.vegetarian, Icon: Sprout } : null,
    item.isSpicy ? { key: "spicy", label: ui.spicy, Icon: Flame } : null,
  ].filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  const mutedColor = mutedFrom(theme);
  const accentColor = theme?.primary;
  const soldOut = Boolean(item.soldOut);

  const allergensLine =
    canShowAllergens && item.allergens?.length
      ? (item.allergens ?? [])
          .filter((entry) => isVisibleAllergen(entry.allergen.code))
          .map((entry) => localizeAllergenName(entry.allergen.code, locale, entry.allergen.name))
          .join(", ")
      : "";

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpenDetail(item.id)}
        className={cn(
          "flex w-full gap-3.5 py-[1.125rem] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4",
          compact && "py-3",
          soldOut && "opacity-60"
        )}
        style={
          theme
            ? ({ ["--tw-ring-offset-color" as string]: theme.background, ["--tw-ring-color" as string]: theme.primary } as CSSProperties)
            : undefined
        }
      >
        <ItemThumbnail image={thumb} itemName={item.name} compact={compact} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-4">
            <p className="min-w-0 text-[1.0625rem] font-semibold leading-snug">
              <span className={soldOut ? "line-through decoration-1" : undefined}>{item.name}</span>
              <SoldOutBadge label={item.soldOut} />
            </p>
            {primaryLabel ? (
              <span
                className="shrink-0 text-[1.0625rem] font-semibold tabular-nums"
                style={accentColor ? { color: accentColor } : undefined}
              >
                {primaryLabel}
              </span>
            ) : null}
          </div>

          {item.description ? (
            <p
              className={cn("mt-1 max-w-[62ch] text-[0.95rem] leading-[1.45]", !theme && "text-muted-foreground")}
              style={theme ? { color: mutedColor } : undefined}
            >
              {item.description}
            </p>
          ) : null}

          {restLabels.length ? (
            <p className={cn("mt-1 text-sm tabular-nums", !theme && "text-muted-foreground")} style={theme ? { color: mutedColor } : undefined}>
              {restLabels.join(" · ")}
            </p>
          ) : null}

          {diet.length || (item.isFeatured && showFeaturedMark) ? (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem]" style={theme ? { color: mutedColor } : undefined}>
              {item.isFeatured && showFeaturedMark ? (
                <span className="inline-flex items-center gap-1 font-medium" style={accentColor ? { color: accentColor } : undefined}>
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden /> {ui.recommended}
                </span>
              ) : null}
              {diet.map(({ key, label, Icon }) => (
                <span key={key} className="inline-flex items-center gap-1">
                  <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                </span>
              ))}
            </p>
          ) : null}

          {allergensLine ? (
            <p className={cn("mt-1.5 text-[0.8125rem] leading-snug", !theme && "text-muted-foreground")} style={theme ? { color: mutedColor } : undefined}>
              <span className="font-medium">{ui.allergens}:</span> {allergensLine}
            </p>
          ) : null}
        </div>
      </button>
    </li>
  );
}

export function ClassicTemplate({
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
  /** Rendered inside PublicMenuShell: no own header or card chrome, sections are anchor targets. */
  embedded?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ui = getUi(locale);
  const compact = theme?.density === "compact";

  const allCurrencies = useMemo(() => collectAllCurrencies(categories), [categories]);
  const displayCurrency = useMemo(
    () => resolveMenuDisplayCurrency(initialCurrency, searchParams.get("currency"), allCurrencies),
    [initialCurrency, allCurrencies, searchParams]
  );

  const featuredItems = useMemo(
    () =>
      categories.flatMap((category) =>
        category.items.filter((item) => item.isFeatured).map((item) => ({ item, categoryId: category.id }))
      ),
    [categories]
  );

  const showFeaturedBlock = featuredItems.length > 0;

  const setLocale = (nextLocale: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("locale", nextLocale);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const shellStyle = theme
    ? {
        backgroundColor: theme.background,
        color: theme.text,
        borderColor: `${theme.border}99`,
        fontFamily: theme.fontFamily,
      }
    : undefined;

  const dividerColor = theme ? `${theme.border}66` : undefined;

  const visibleCategories = categories.filter((category) => category.items.length > 0);

  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const detailItem = useMemo(
    () => categories.flatMap((c) => c.items).find((i) => i.id === detailItemId) ?? null,
    [categories, detailItemId]
  );
  const detailLabels = useMemo(() => getMenuItemDetailModalLabels(locale), [locale]);

  return (
    <div
      className={cn(
        embedded
          ? "px-5 pb-6 sm:px-8"
          : "mx-auto max-w-2xl rounded-2xl border border-border/45 px-4 pb-6 pt-5 sm:px-6",
        !embedded && !theme && "border-border/50 bg-card/30"
      )}
      style={embedded ? undefined : shellStyle}
    >
      {embedded ? null : (
      <header
        className={cn(
          "mb-8 border-b border-border/30 pb-5",
          compact && "mb-6 pb-4"
        )}
        style={dividerColor ? { borderColor: dividerColor } : undefined}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0 pr-1" style={theme ? { color: theme.text } : undefined}>
            <div className={cn("mb-2")}>
              <Logo className={cn("text-sm", theme ? "[&_*]:opacity-95" : "text-foreground")} />
            </div>
            <h1 className="break-words font-display text-2xl font-bold leading-tight tracking-tight sm:text-[1.75rem]">
              {title}
            </h1>
          </div>
          {locales.length > 1 ? (
            <label className="block w-full max-w-full justify-self-stretch sm:w-auto sm:max-w-[10rem] sm:justify-self-end">
              <span className="sr-only">{ui.language}</span>
              <select
                value={locale}
                onChange={(event) => setLocale(event.target.value)}
                aria-label={ui.language}
                className={cn(
                  "h-9 w-full max-w-full cursor-pointer rounded-lg border border-border/60 bg-background py-0 pl-2 pr-8 text-[10px] font-semibold uppercase tracking-wide outline-none",
                  !theme && "border-border bg-background text-foreground shadow-sm"
                )}
                style={
                  theme
                    ? {
                        borderColor: theme.border,
                        backgroundColor: `${theme.surface}E6`,
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
      </header>
      )}

      {showFeaturedBlock && embedded ? (
        <section className="-mx-5 mb-4 pt-4 sm:-mx-8" aria-labelledby="classic-featured-heading">
          <h2 id="classic-featured-heading" className="px-5 font-display text-xl font-bold tracking-[-0.015em] sm:px-8">
            {ui.featuredSection}
          </h2>
          <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden">
            {featuredItems.map(({ item }) => {
              const { primaryLabel } = formatItemPriceRow(item, displayCurrency, locale);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDetailItemId(item.id)}
                  className="flex w-[72%] max-w-[17rem] shrink-0 snap-start flex-col justify-between rounded-[14px] border p-4 text-left outline-none focus-visible:ring-2"
                  style={theme ? { backgroundColor: theme.surface, borderColor: theme.border } : undefined}
                >
                  <span className="block">
                    <span className="block font-semibold leading-snug">
                      {item.name}
                      <SoldOutBadge label={item.soldOut} />
                    </span>
                    {item.description ? (
                      <span className="mt-1 line-clamp-2 block text-sm leading-snug" style={theme ? { color: mutedFrom(theme) } : undefined}>
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  {primaryLabel ? (
                    <span className="mt-3 block font-semibold tabular-nums" style={theme ? { color: theme.primary } : undefined}>
                      {primaryLabel}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : showFeaturedBlock ? (
        <section className={cn("mb-10 scroll-mt-20", compact && "mb-8")} aria-labelledby="classic-featured-heading">
          <div
            className="mb-4 flex flex-col gap-1 border-b border-border/25 pb-2"
            style={dividerColor ? { borderColor: dividerColor } : undefined}
          >
            <h2
              id="classic-featured-heading"
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            >
              {ui.featuredSection}
            </h2>
          </div>
          <ul className="divide-y divide-border/20">
            {featuredItems.map(({ item }) => (
              <ClassicDishRow
                key={item.id}
                item={item}
                locale={locale}
                displayCurrency={displayCurrency}
                canShowAllergens={canShowAllergens}
                ui={ui}
                compact={compact}
                showFeaturedMark={false}
                theme={theme}
                onOpenDetail={setDetailItemId}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <div className={embedded ? "space-y-9" : "space-y-10 sm:space-y-12"}>
        {visibleCategories.map((category) => (
          <section
            key={category.id}
            id={`sec-${category.id}`}
            data-menu-section={category.id}
            className="scroll-mt-20 pt-5"
          >
            <div className="mb-1">
              <h2 className="font-display text-[1.6rem] font-bold leading-tight tracking-[-0.02em]">{category.name}</h2>
              {category.description ? (
                <p
                  className={cn("mt-1 whitespace-pre-line text-[0.95rem] leading-snug", !theme && "text-muted-foreground")}
                  style={theme ? { color: mutedFrom(theme) } : undefined}
                >
                  {category.description}
                </p>
              ) : null}
            </div>

            <ul className="divide-y divide-border">
              {category.items.map((item) => (
                <ClassicDishRow
                  key={item.id}
                  item={item}
                  locale={locale}
                  displayCurrency={displayCurrency}
                  canShowAllergens={canShowAllergens}
                  ui={ui}
                  compact={compact}
                  showFeaturedMark={Boolean(item.isFeatured)}
                  theme={theme}
                  onOpenDetail={setDetailItemId}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <MenuItemDetailModal
        item={detailItem}
        open={detailItem !== null}
        onClose={() => setDetailItemId(null)}
        locale={locale}
        displayCurrency={displayCurrency}
        canShowAllergens={canShowAllergens}
        labels={detailLabels}
        variant="classic"
        theme={theme}
      />
    </div>
  );
}
