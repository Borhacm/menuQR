"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from "react";
import type { MenuItem, MenuTheme } from "@/components/menu-templates/types";
import { formatPrice } from "@/config/currencies";
import { isVisibleAllergen, localizeAllergenName } from "@/lib/allergens";
import { shouldOptimizeImageSrc } from "@/lib/images";
import { buildVariantUrl } from "@/lib/media-cdn";
import { cn } from "@/lib/utils";

export type MenuItemDetailModalLabels = {
  itemDetails: string;
  close: string;
  previousPhoto: string;
  nextPhoto: string;
  photoIndicator: string;
  vegan: string;
  vegetarian: string;
  spicy: string;
};

const labelsByLocale: Record<string, MenuItemDetailModalLabels> = {
  es: {
    itemDetails: "Producto",
    close: "Cerrar",
    previousPhoto: "Foto anterior",
    nextPhoto: "Foto siguiente",
    photoIndicator: "Foto {{current}} de {{total}}",
    vegan: "Vegano",
    vegetarian: "Vegetariano",
    spicy: "Picante",
  },
  en: {
    itemDetails: "Item",
    close: "Close",
    previousPhoto: "Previous photo",
    nextPhoto: "Next photo",
    photoIndicator: "Photo {{current}} of {{total}}",
    vegan: "Vegan",
    vegetarian: "Vegetarian",
    spicy: "Spicy",
  },
};

export function getMenuItemDetailModalLabels(locale: string): MenuItemDetailModalLabels {
  const key = locale.toLowerCase().split("-")[0] ?? "en";
  return labelsByLocale[key] ?? labelsByLocale.en;
}

function interpolatePhotoIndicator(template: string, current: number, total: number) {
  return template.replace("{{current}}", String(current)).replace("{{total}}", String(total));
}

function ModalImage({
  url,
  alt,
  itemName,
  sizes,
  className,
}: {
  url: string;
  alt: string | null | undefined;
  itemName: string;
  sizes: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!url.trim() || failed) return null;
  return (
    <Image
      src={shouldOptimizeImageSrc(url) ? buildVariantUrl(url, 1200, "webp") : url}
      alt={alt ?? itemName}
      width={1200}
      height={675}
      unoptimized={!shouldOptimizeImageSrc(url)}
      onError={() => setFailed(true)}
      className={cn("aspect-video w-full object-cover", className)}
      sizes={sizes}
      priority
    />
  );
}

function useCarouselIndex(
  scrollerRef: MutableRefObject<HTMLDivElement | null>,
  slideCount: number,
  resetKey: string
) {
  const [index, setIndex] = useState(0);

  const syncIndexFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || slideCount <= 0) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    setIndex(Math.min(slideCount - 1, Math.max(0, Math.round(el.scrollLeft / w))));
  }, [scrollerRef, slideCount]);

  const scrollToIndex = useCallback(
    (next: number) => {
      const el = scrollerRef.current;
      if (!el || slideCount <= 0) return;
      const clamped = Math.max(0, Math.min(slideCount - 1, next));
      const w = el.clientWidth;
      el.scrollTo({ left: clamped * w, behavior: "smooth" });
      setIndex(clamped);
    },
    [scrollerRef, slideCount]
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || slideCount <= 1) return;
    el.addEventListener("scroll", syncIndexFromScroll, { passive: true });
    const ro = new ResizeObserver(syncIndexFromScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", syncIndexFromScroll);
      ro.disconnect();
    };
  }, [scrollerRef, slideCount, syncIndexFromScroll]);

  useEffect(() => {
    setIndex(0);
    queueMicrotask(() => scrollerRef.current?.scrollTo({ left: 0 }));
  }, [resetKey, slideCount, scrollerRef]);

  return { index, scrollToIndex };
}

function ItemPhotoCarousel({
  photos,
  itemName,
  labels,
  variant,
  theme,
  sizes,
  roundedClass,
  resetKey,
}: {
  photos: NonNullable<MenuItem["images"]>;
  itemName: string;
  labels: MenuItemDetailModalLabels;
  variant: "grid" | "modern" | "classic";
  theme?: MenuTheme;
  sizes: string;
  roundedClass: string;
  resetKey: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { index, scrollToIndex } = useCarouselIndex(scrollerRef, photos.length, resetKey);
  const regionId = useId();

  const navBtnClass =
    variant === "grid"
      ? "rounded-full border border-white/35 bg-slate-900/85 p-1.5 text-white shadow-md backdrop-blur hover:bg-slate-800/90"
      : variant === "classic"
        ? "rounded-full border border-border/60 bg-background/95 p-1.5 text-foreground shadow-md backdrop-blur hover:bg-muted/80"
        : cn(
            "rounded-full border p-1.5 shadow-md backdrop-blur",
            theme
              ? "hover:opacity-95"
              : "border-border/60 bg-background/95 text-foreground hover:bg-muted/80"
          );

  const dotActive =
    variant === "grid"
      ? "bg-cyan-300"
      : variant === "classic"
        ? "bg-primary"
        : theme
          ? "opacity-100"
          : "bg-primary";

  const dotInactive =
    variant === "grid" ? "bg-white/35" : variant === "classic" ? "bg-muted-foreground/35" : "bg-muted-foreground/40";

  return (
    <div className="relative mb-3">
      <div
        id={regionId}
        ref={scrollerRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={interpolatePhotoIndicator(labels.photoIndicator, index + 1, photos.length)}
        className={cn(
          "flex snap-x snap-mandatory gap-0 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          roundedClass
        )}
      >
        {photos.map((photo, i) => (
          <div
            key={photo.id ?? `${photo.url}-${i}`}
            className="min-w-full shrink-0 snap-center"
            aria-hidden={i !== index}
          >
            <ModalImage
              url={photo.url}
              alt={photo.alt}
              itemName={itemName}
              sizes={sizes}
              className={roundedClass}
            />
          </div>
        ))}
      </div>

      {photos.length > 1 ? (
        <>
          <button
            type="button"
            aria-controls={regionId}
            disabled={index <= 0}
            onClick={() => scrollToIndex(index - 1)}
            className={cn(
              "absolute left-2 top-1/2 z-[1] -translate-y-1/2 disabled:pointer-events-none disabled:opacity-30",
              navBtnClass
            )}
            style={
              variant === "modern" && theme
                ? {
                    borderColor: theme.border,
                    backgroundColor: `${theme.surface}E6`,
                    color: theme.text,
                  }
                : undefined
            }
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            <span className="sr-only">{labels.previousPhoto}</span>
          </button>
          <button
            type="button"
            aria-controls={regionId}
            disabled={index >= photos.length - 1}
            onClick={() => scrollToIndex(index + 1)}
            className={cn(
              "absolute right-2 top-1/2 z-[1] -translate-y-1/2 disabled:pointer-events-none disabled:opacity-30",
              navBtnClass
            )}
            style={
              variant === "modern" && theme
                ? {
                    borderColor: theme.border,
                    backgroundColor: `${theme.surface}E6`,
                    color: theme.text,
                  }
                : undefined
            }
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
            <span className="sr-only">{labels.nextPhoto}</span>
          </button>
          <div className="mt-2 flex justify-center gap-1.5" role="tablist" aria-label={labels.photoIndicator}>
            {photos.map((photo, i) => (
              <button
                key={photo.id ?? `${photo.url}-dot-${i}`}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={interpolatePhotoIndicator(labels.photoIndicator, i + 1, photos.length)}
                onClick={() => scrollToIndex(i)}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-opacity",
                  i === index ? dotActive : cn("opacity-50 hover:opacity-80", dotInactive)
                )}
                style={
                  variant === "modern" && theme && i === index
                    ? { backgroundColor: theme.primary }
                    : undefined
                }
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function formatPriceBlock(item: MenuItem, displayCurrency: string, locale: string) {
  const primary = item.prices.find((p) => p.currency === displayCurrency) ?? item.prices[0] ?? null;
  const rest = primary ? item.prices.filter((p) => p.id !== primary.id) : item.prices;
  const primaryLabel = primary
    ? formatPrice(Number(primary.amount), primary.currency, locale)
    : null;
  const restLabels = rest
    .map((p) => formatPrice(Number(p.amount), p.currency, locale))
    .filter(Boolean);
  return { primaryLabel, restLabels };
}

export function MenuItemDetailModal({
  item,
  open,
  onClose,
  locale,
  displayCurrency,
  canShowAllergens,
  labels,
  variant,
  theme,
}: {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  locale: string;
  displayCurrency: string;
  canShowAllergens: boolean;
  labels: MenuItemDetailModalLabels;
  variant: "grid" | "modern" | "classic";
  theme?: MenuTheme;
}) {
  const titleId = useId();
  const photos = (item?.images ?? []).filter((img) => img.url?.trim());

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  const { primaryLabel, restLabels } = formatPriceBlock(item, displayCurrency, locale);

  const panelStyle: CSSProperties | undefined =
    variant === "modern" && theme
      ? {
          borderColor: theme.border,
          backgroundColor: theme.surface,
          color: theme.text,
        }
      : variant === "classic" && theme
        ? {
            borderColor: `${theme.border}99`,
            backgroundColor: theme.background,
            color: theme.text,
          }
        : undefined;

  const chipClass =
    variant === "grid"
      ? "rounded-full border border-white/25 bg-slate-800/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-200"
      : variant === "classic"
        ? "rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground"
        : "rounded-full border border-border/80 bg-card/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground";

  const closeBtnClass =
    variant === "grid"
      ? "rounded-md border border-white/30 bg-slate-800/80 p-1 text-slate-200 hover:bg-slate-700/80"
      : variant === "classic"
        ? "rounded-md border border-border/60 bg-background/90 p-1 text-foreground hover:bg-muted/80"
        : cn("rounded-md border border-border/60 bg-background/90 p-1 hover:bg-muted/80");

  const headingMuted =
    variant === "grid"
      ? "text-cyan-200/80"
      : variant === "classic"
        ? "text-muted-foreground"
        : "text-muted-foreground";

  const priceBadgeClass =
    variant === "grid"
      ? "inline-block rounded-lg border border-cyan-300/55 bg-cyan-400/20 px-2.5 py-1 text-sm font-semibold text-cyan-100"
      : variant === "classic"
        ? "inline-block rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-sm font-semibold"
        : "inline-flex rounded-full border border-border/80 bg-card/70 px-2.5 py-1 text-sm font-semibold text-muted-foreground";

  const innerRounded =
    variant === "grid"
      ? "rounded-xl"
      : variant === "modern"
        ? "rounded-2xl"
        : "rounded-xl";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] overflow-y-auto overscroll-contain px-3 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]",
        variant === "grid" ? "bg-black/55" : variant === "classic" ? "bg-black/50" : "bg-black/60 backdrop-blur-[2px]"
      )}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "mx-auto my-10 w-full max-w-xl border shadow-2xl backdrop-blur sm:rounded-2xl",
          variant === "grid"
            ? "rounded-2xl border-white/25 bg-slate-900/95 p-3"
            : variant === "classic"
              ? "rounded-2xl border-border/60 bg-card/95 p-4"
              : "rounded-[22px] border-border/80 bg-background/95 p-4"
        )}
        style={panelStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]", headingMuted)}
              style={
                variant === "modern" && theme
                  ? { color: `${theme.text}99` }
                  : variant === "classic" && theme
                    ? { color: `${theme.text}B3` }
                    : undefined
              }
            >
              {labels.itemDetails}
            </p>
            <h3
              id={titleId}
              className={cn(
                "text-xl font-semibold leading-tight",
                variant === "grid" ? "text-white" : variant === "classic" ? "" : ""
              )}
              style={
                variant === "modern" && theme
                  ? { color: theme.text }
                  : variant === "classic" && theme
                    ? { color: theme.text }
                    : undefined
              }
            >
              {item.name}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label={labels.close} className={closeBtnClass}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {photos.length > 0 ? (
          photos.length > 1 ? (
            <ItemPhotoCarousel
              photos={photos}
              itemName={item.name}
              labels={labels}
              variant={variant}
              theme={theme}
              sizes="(max-width: 640px) 100vw, 640px"
              roundedClass={innerRounded}
              resetKey={item.id}
            />
          ) : (
            <ModalImage
              url={photos[0].url}
              alt={photos[0].alt}
              itemName={item.name}
              sizes="(max-width: 640px) 100vw, 640px"
              className={cn("mb-3", innerRounded)}
            />
          )
        ) : null}

        {item.description ? (
          <p
            className={cn(
              "mb-3 text-sm leading-relaxed",
              variant === "grid" ? "font-medium text-slate-200" : "text-muted-foreground"
            )}
            style={
              variant === "modern" && theme
                ? { color: `${theme.text}CC` }
                : variant === "classic" && theme
                  ? { color: `${theme.text}CC` }
                  : undefined
            }
          >
            {item.description}
          </p>
        ) : null}

        <div className="mb-3 flex flex-wrap gap-1.5">
          {item.isVegan ? <span className={chipClass}>{labels.vegan}</span> : null}
          {item.isVegetarian ? <span className={chipClass}>{labels.vegetarian}</span> : null}
          {item.isSpicy ? <span className={chipClass}>{labels.spicy}</span> : null}
          {canShowAllergens
            ? (item.allergens ?? [])
                .filter((entry) => isVisibleAllergen(entry.allergen.code))
                .map((entry) => (
                  <span key={entry.allergen.id} className={chipClass}>
                    {entry.allergen.icon ? `${entry.allergen.icon} ` : ""}
                    {localizeAllergenName(entry.allergen.code, locale, entry.allergen.name)}
                  </span>
                ))
            : null}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {primaryLabel ? (
            <span
              className={priceBadgeClass}
              style={
                variant === "classic" && theme
                  ? { borderColor: theme.primary, color: theme.primary }
                  : variant === "modern" && theme
                    ? {
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                        color: theme.text,
                      }
                    : undefined
              }
            >
              {primaryLabel}
            </span>
          ) : (
            <span className={priceBadgeClass}>—</span>
          )}
          {restLabels.length ? (
            <span
              className={cn("text-xs tabular-nums", variant === "grid" ? "text-slate-400" : "text-muted-foreground")}
            >
              {restLabels.join(" · ")}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
