"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemImagePicker } from "@/components/admin/item-image-picker";

function buildDescriptionSuggestion(name: string, suffix: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  const lowered = trimmed.toLowerCase();
  const hash = Array.from(lowered).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7);
  const pick = (values: string[], offset = 0) => values[(hash + offset) % values.length];
  const ingredientCatalog = [
    { pattern: /mozzarella/, label: "mozzarella" },
    { pattern: /parmesan|parmesano/, label: "parmesano" },
    { pattern: /trufa/, label: "trufa" },
    { pattern: /tomate/, label: "tomate" },
    { pattern: /albahaca/, label: "albahaca" },
    { pattern: /pollo/, label: "pollo" },
    { pattern: /ternera|carne/, label: "ternera" },
    { pattern: /cerdo|ib[eé]rico/, label: "cerdo" },
    { pattern: /salm[oó]n/, label: "salmón" },
    { pattern: /at[uú]n/, label: "atún" },
    { pattern: /gamba|langostino/, label: "gambas" },
    { pattern: /seta|champiñ[oó]n|portobello/, label: "setas" },
    { pattern: /queso/, label: "queso" },
    { pattern: /huevo/, label: "huevo" },
    { pattern: /aguacate/, label: "aguacate" },
    { pattern: /cebolla/, label: "cebolla" },
    { pattern: /pimiento/, label: "pimiento" },
    { pattern: /chocolate/, label: "chocolate" },
    { pattern: /vainilla/, label: "vainilla" },
    { pattern: /caf[eé]/, label: "café" },
  ];
  const detectedIngredients = ingredientCatalog
    .filter((entry) => entry.pattern.test(lowered))
    .map((entry) => entry.label)
    .slice(0, 3);
  const ingredientText =
    detectedIngredients.length > 0
      ? `con ${detectedIngredients.join(", ")}`
      : "con ingredientes frescos";

  const style = pick([
    "sabor casero",
    "toque mediterráneo",
    "perfil equilibrado",
    "estilo tradicional",
    "carácter intenso",
  ]);
  const texture = pick(
    ["textura cremosa", "textura crujiente", "textura jugosa", "textura suave", "textura ligera"],
    1
  );
  const finish = pick(
    [
      "acabado aromático",
      "final fresco",
      "toque especiado",
      "equilibrio perfecto",
      "resultado muy sabroso",
    ],
    2
  );

  let focus = "ingredientes frescos";
  if (/(pizza|pasta|risotto|lasagna|lasaña|ravioli)/.test(lowered)) focus = "inspiración italiana";
  else if (/(burger|hamburg|sándwich|sandwich)/.test(lowered)) focus = "preparación al momento";
  else if (/(ensalada|bowl|caprese)/.test(lowered)) focus = "producto de temporada";
  else if (/(pollo|carne|ternera|cerdo|costilla)/.test(lowered)) focus = "cocción en su punto";
  else if (/(pescado|salmón|atun|atún|marisco|gamba)/.test(lowered)) focus = "sabor del mar";
  else if (/(café|tarta|postre|helado|brownie|tiramisu|tiramisú)/.test(lowered)) {
    focus = "dulzor equilibrado";
  }

  const patterns = [
    `${trimmed} de ${style}, ${ingredientText}, ${texture} y ${finish}.`,
    `${trimmed} elaborado al momento, ${ingredientText}, con ${focus} y ${finish}.`,
    `${trimmed}: receta de la casa ${ingredientText}, ${texture} y ${finish}.`,
    `${trimmed} ${ingredientText}; una opción de ${style}, ${focus} y ${finish}.`,
  ];

  const suggestion = patterns[hash % patterns.length];
  return suggestion || `${trimmed} ${suffix}`;
}

function getCurrencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case "EUR":
      return "€";
    case "USD":
      return "$";
    case "GBP":
      return "£";
    default:
      return currency.toUpperCase();
  }
}

function focusNextField(currentElement: HTMLElement) {
  const form = currentElement.closest("form");
  if (!form) return;
  const focusableElements = Array.from(
    form.querySelectorAll<HTMLElement>(
      "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex='-1'])"
    )
  ).filter((element) => element.offsetParent !== null);
  const currentIndex = focusableElements.indexOf(currentElement);
  if (currentIndex < 0) return;
  const nextElement = focusableElements[currentIndex + 1];
  if (nextElement) {
    nextElement.focus();
  } else {
    currentElement.blur();
  }
}

export function ItemFormAssistant({
  canUseMultipleCurrencies = true,
  availableCurrencies = ["EUR"],
  categoryOptions = [],
  categoryFieldLabel = "Category",
  canUseAllergens = false,
  allergenOptions = [],
  allergensLabel = "Allergens",
  allergensPaidOnlyLabel = "Allergen labels are available on paid plans.",
  upgradeHref = "/app/billing",
  upgradeLabel = "Upgrade to unlock",
  labels,
  imagePickerLabels,
}: {
  canUseMultipleCurrencies?: boolean;
  availableCurrencies?: string[];
  categoryOptions?: { id: string; label: string }[];
  categoryFieldLabel?: string;
  canUseAllergens?: boolean;
  allergenOptions?: { code: string; label: string }[];
  allergensLabel?: string;
  allergensPaidOnlyLabel?: string;
  upgradeHref?: string;
  upgradeLabel?: string;
  labels: {
    tagsAndAllergens: string;
    suggestedDescriptionSuffix: string;
    imageAltPrefix: string;
    imageAltFallback: string;
    name: string;
    namePlaceholder: string;
    description: string;
    suggestDescription: string;
    descriptionPlaceholder: string;
    prices: string;
    addCurrency: string;
    removeCurrency: string;
    currencyPlaceholder: string;
    multiCurrencyPaidOnly: string;
    imageUrl: string;
    autoAltText: string;
    featuredItem: string;
    spicy: string;
    vegan: string;
    vegetarian: string;
    glutenFree: string;
    livePreview: string;
    imagePreviewPlaceholder: string;
    imagePreviewFailed: string;
    dishNameFallback: string;
    dishDescriptionFallback: string;
  };
  imagePickerLabels: {
    uploading: string;
    uploadFailedRetry: string;
    invalidUploadUrl: string;
    uploadReady: string;
    uploadFailedConnection: string;
    uploadImage: string;
    searchUnsplash: string;
    searchPexels: string;
    inputPlaceholder: string;
    helper: string;
    defaultQuery: string;
    unsplashAdjustedNotice: string;
    invalidUrlHelp: string;
    unsupportedStockPageHelp: string;
  };
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const fallbackCurrency = availableCurrencies[0] ?? "EUR";
  const [prices, setPrices] = useState([{ amount: "", currency: fallbackCurrency }]);
  const [imageUrl, setImageUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);

  const suggestedDescription = useMemo(
    () => buildDescriptionSuggestion(name, labels.suggestedDescriptionSuffix),
    [labels.suggestedDescriptionSuffix, name]
  );
  const imageAlt = useMemo(() => {
    const trimmed = name.trim();
    return trimmed ? `${labels.imageAltPrefix} ${trimmed}` : labels.imageAltFallback;
  }, [labels.imageAltFallback, labels.imageAltPrefix, name]);
  const previewCurrency = prices[0]?.currency ?? "EUR";
  const previewAmount = prices[0]?.amount || "0.00";
  const previewPrice = `${previewAmount} ${getCurrencySymbol(previewCurrency)}`;
  useEffect(() => {
    setImagePreviewFailed(false);
  }, [imageUrl]);

  function handleKeyDownCapture(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter") return;
    if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    if (target.type === "submit" || target.type === "button" || target.type === "checkbox") return;
    event.preventDefault();
    focusNextField(target);
  }

  return (
    <div className="contents" onKeyDownCapture={handleKeyDownCapture}>
      <div className="grid gap-3 md:col-span-2 md:grid-cols-10">
        <div className="space-y-2 md:col-span-3">
          <Label>{labels.name}</Label>
          <Input
            id="item-name-input"
            name="name"
            placeholder={labels.namePlaceholder}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <label className="flex items-center gap-2 pt-1 text-sm">
            <input
              type="checkbox"
              name="isFeatured"
              checked={isFeatured}
              onChange={(event) => setIsFeatured(event.target.checked)}
            />
            {labels.featuredItem}
          </label>
        </div>
        <div className="space-y-2 md:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <Label>{labels.description}</Label>
            <button
              type="button"
              onClick={() => setDescription(suggestedDescription)}
              disabled={!suggestedDescription}
              className="text-xs text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:text-muted-foreground"
            >
              {labels.suggestDescription}
            </button>
          </div>
          <Input
            id="item-description-input"
            name="description"
            placeholder={labels.descriptionPlaceholder}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
      </div>
      <div className="md:col-span-2 grid gap-3 md:grid-cols-[280px_minmax(0,1fr)] md:items-start">
        <div className="space-y-2">
          <Label>{labels.prices}</Label>
          <div className="max-w-[280px] space-y-2">
            {prices.map((price, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-[120px_160px]">
                <select
                  name="currencyValues"
                  value={price.currency}
                  aria-label={labels.currencyPlaceholder}
                  disabled={!canUseMultipleCurrencies && idx > 0}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  onChange={(event) =>
                    setPrices((current) =>
                      current.map((entry, entryIdx) =>
                        entryIdx === idx ? { ...entry, currency: event.target.value.toUpperCase() } : entry
                      )
                    )
                  }
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
                  min={idx === 0 ? "0.01" : "0"}
                  required={idx === 0}
                  value={price.amount}
                  disabled={!canUseMultipleCurrencies && idx > 0}
                  className="w-full"
                  onChange={(event) =>
                    setPrices((current) =>
                      current.map((entry, entryIdx) =>
                        entryIdx === idx ? { ...entry, amount: event.target.value } : entry
                      )
                    )
                  }
                />
                {canUseMultipleCurrencies && idx > 0 ? (
                  <button
                    type="button"
                    className="sm:col-span-3 justify-self-start text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    onClick={() =>
                      setPrices((current) => current.filter((_, entryIdx) => entryIdx !== idx))
                    }
                  >
                    {labels.removeCurrency}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {canUseMultipleCurrencies ? (
            <button
              type="button"
              className="text-xs text-primary underline underline-offset-4"
              onClick={() =>
                setPrices((current) => [...current, { amount: "", currency: fallbackCurrency }])
              }
            >
              {labels.addCurrency}
            </button>
          ) : null}
          {!canUseMultipleCurrencies ? (
            <p className="text-xs text-muted-foreground">
              {labels.multiCurrencyPaidOnly}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>{categoryFieldLabel}</Label>
          <select
            name="categoryId"
            aria-label={categoryFieldLabel}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            disabled={!categoryOptions.length}
          >
            {categoryOptions.length ? (
              categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))
            ) : (
              <option value="">{categoryFieldLabel}</option>
            )}
          </select>
        </div>
      </div>
      <div className="space-y-2 md:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <Label>{labels.tagsAndAllergens}</Label>
          {!canUseAllergens ? (
            <Link href={upgradeHref} className="text-xs text-primary underline underline-offset-4">
              {upgradeLabel}
            </Link>
          ) : null}
        </div>
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {labels.tagsAndAllergens}
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isSpicy"
                checked={isSpicy}
                onChange={(event) => setIsSpicy(event.target.checked)}
              />
              <span>🌶️ {labels.spicy}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isVegan"
                checked={isVegan}
                onChange={(event) => setIsVegan(event.target.checked)}
              />
              <span>🌱 {labels.vegan}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isVegetarian"
                checked={isVegetarian}
                onChange={(event) => setIsVegetarian(event.target.checked)}
              />
              <span>🥬 {labels.vegetarian}</span>
            </label>
            <fieldset disabled={!canUseAllergens} className="contents">
              {allergenOptions.map((allergen) => (
                <label key={allergen.code} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="allergens" value={allergen.code} />
                  <span>{allergen.label}</span>
                </label>
              ))}
            </fieldset>
          </div>
          {!canUseAllergens ? (
            <p className="text-xs text-muted-foreground">{allergensPaidOnlyLabel}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>{labels.imageUrl}</Label>
        <ItemImagePicker name="imageUrl" dishName={name} onImageUrlChange={setImageUrl} labels={imagePickerLabels} />
        <input type="hidden" name="imageAlt" value={imageAlt} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>{labels.livePreview}</Label>
        <div className="rounded-xl border bg-card p-3">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={1280}
              height={720}
              unoptimized
              className="mb-3 aspect-video w-full rounded-lg object-cover"
              onError={() => setImagePreviewFailed(true)}
              onLoad={() => setImagePreviewFailed(false)}
            />
          ) : (
            <div className="mb-3 flex aspect-video w-full items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
              {labels.imagePreviewPlaceholder}
            </div>
          )}
          {imageUrl && imagePreviewFailed ? (
            <p className="mb-2 text-xs text-amber-400">{labels.imagePreviewFailed}</p>
          ) : null}
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold">{name || labels.dishNameFallback}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {description || labels.dishDescriptionFallback}
              </p>
            </div>
            <p className="shrink-0 text-lg font-bold text-primary">{previewPrice}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {isFeatured ? <span className="rounded-full border px-2 py-0.5">{labels.featuredItem}</span> : null}
            {isVegan ? <span className="rounded-full border px-2 py-0.5">{labels.vegan}</span> : null}
            {isVegetarian ? <span className="rounded-full border px-2 py-0.5">{labels.vegetarian}</span> : null}
            {isSpicy ? <span className="rounded-full border px-2 py-0.5">{labels.spicy}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

