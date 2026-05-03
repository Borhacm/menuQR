"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type CSSProperties } from "react";
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
    featuredSection: "Recomendados",
    recommended: "Destacado",
    allergens: "Alérgenos",
    vegan: "Vegano",
    vegetarian: "Vegetariano",
    spicy: "Picante",
  },
  en: {
    language: "Language",
    featuredSection: "Featured",
    recommended: "Featured",
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
  const dietBits = [
    item.isVegan ? ui.vegan : null,
    item.isVegetarian ? ui.vegetarian : null,
    item.isSpicy ? ui.spicy : null,
  ].filter(Boolean);
  const mutedColor = theme ? `${theme.text}B3` : undefined;
  const accentColor = theme?.primary;

  const allergensLine =
    canShowAllergens && item.allergens?.length
      ? (item.allergens ?? [])
          .filter((entry) => isVisibleAllergen(entry.allergen.code))
          .map((entry) => localizeAllergenName(entry.allergen.code, locale, entry.allergen.name))
          .join(locale === "es" ? " · " : " · ")
      : "";

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpenDetail(item.id)}
        className={cn(
          "flex w-full gap-3 rounded-xl py-4 text-left outline-none transition-colors hover:bg-muted/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          compact && "py-3"
        )}
        style={
          theme ? ({ ["--tw-ring-offset-color" as string]: theme.background } as CSSProperties) : undefined
        }
      >
      <ItemThumbnail image={thumb} itemName={item.name} compact={compact} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 text-[15px] font-medium leading-snug sm:text-base">
            <span>{item.name}</span>
            {item.isFeatured && showFeaturedMark ? (
              <span
                className="ml-1.5 text-[11px] font-normal text-muted-foreground"
                style={{ color: mutedColor }}
              >
                · {ui.recommended}
              </span>
            ) : null}
          </p>
          {primaryLabel ? (
            <span
              className="shrink-0 tabular-nums text-[15px] font-semibold sm:text-base"
              style={accentColor ? { color: accentColor } : undefined}
            >
              {primaryLabel}
            </span>
          ) : null}
        </div>

        {item.description ? (
          <p
            className={cn(
              "mt-1 text-[13px] leading-relaxed sm:text-sm",
              theme ? "text-muted-foreground" : "text-foreground/80"
            )}
            style={theme ? { color: mutedColor } : undefined}
          >
            {item.description}
          </p>
        ) : null}

        {restLabels.length ? (
          <p
            className={cn("mt-1 text-[12px] tabular-nums", theme ? "text-muted-foreground" : "text-foreground/72")}
            style={theme ? { color: mutedColor } : undefined}
          >
            {restLabels.join(" · ")}
          </p>
        ) : null}

        {dietBits.length ? (
          <p
            className={cn("mt-1.5 text-[11px]", theme ? "text-muted-foreground/90" : "text-foreground/70")}
            style={theme ? { color: mutedColor } : undefined}
          >
            {dietBits.join(" · ")}
          </p>
        ) : null}

        {allergensLine ? (
          <p
            className={cn("mt-1.5 text-[11px] leading-relaxed", theme ? "text-muted-foreground/85" : "text-foreground/68")}
            style={theme ? { color: mutedColor } : undefined}
          >
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
        "mx-auto max-w-2xl rounded-2xl border border-border/45 px-4 pb-6 pt-5 sm:px-6",
        !theme && "border-border/50 bg-card/30"
      )}
      style={shellStyle}
    >
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

      {showFeaturedBlock ? (
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

      <div className="space-y-10 sm:space-y-12">
        {visibleCategories.map((category) => (
          <section key={category.id} className="scroll-mt-20">
            <div
              className="mb-4 flex flex-col gap-1 border-b border-border/25 pb-2"
              style={dividerColor ? { borderColor: dividerColor } : undefined}
            >
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {category.name}
              </h2>
              {category.description ? (
                <p className="text-sm font-normal leading-snug text-muted-foreground/90">{category.description}</p>
              ) : null}
            </div>

            <ul className="divide-y divide-border/20">
              {category.items.map((item) => (
                <ClassicDishRow
                  key={item.id}
                  item={item}
                  locale={locale}
                  displayCurrency={displayCurrency}
                  canShowAllergens={canShowAllergens}
                  ui={ui}
                  compact={compact}
                  showFeaturedMark={Boolean(item.isFeatured && !showFeaturedBlock)}
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
