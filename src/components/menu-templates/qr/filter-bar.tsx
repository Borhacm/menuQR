"use client";

import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { localizeAllergenName } from "@/lib/allergens";
import type { MenuTheme } from "@/components/menu-templates/types";

export type DietFilterState = {
  vegan: boolean;
  vegetarian: boolean;
  spicy: boolean;
};

export type DietFilterChip = {
  key: "vegan" | "vegetarian" | "spicy";
  label: string;
  icon: typeof Leaf;
};

export function FilterBar({
  showSpicyFilter,
  dietFilterChips,
  dietFilters,
  onToggleDietFilter,
  ui,
  excludedAllergenCode,
  onExcludeAllergenChange,
  allergenCodes,
  locale,
  theme,
}: {
  showSpicyFilter: boolean;
  dietFilterChips: ReadonlyArray<DietFilterChip>;
  dietFilters: DietFilterState;
  onToggleDietFilter: (key: keyof DietFilterState, enabled: boolean) => void;
  ui: {
    excludeAllergen: string;
    noAllergenExclusion: string;
  };
  excludedAllergenCode: string;
  onExcludeAllergenChange: (code: string) => void;
  allergenCodes: ReadonlyArray<string>;
  locale: string;
  theme?: MenuTheme;
}) {
  return (
    <div className="sticky top-2 z-10 space-y-2">
      <div className="flex flex-wrap items-stretch gap-2">
        {dietFilterChips.map((chip) => {
          const enabled = dietFilters[chip.key as keyof typeof dietFilters];
          const ChipIcon = chip.icon;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => onToggleDietFilter(chip.key, !enabled)}
              className={cn(
                "inline-flex min-h-8 min-w-0 flex-1 basis-[calc(50%-0.25rem)] items-center justify-center gap-1 rounded-full border px-2 text-[10px] font-medium leading-tight transition-all duration-200 ease-out active:scale-[0.98] sm:max-w-[9rem] sm:basis-auto sm:px-2.5",
                enabled
                  ? chip.key === "spicy"
                    ? "border-rose-300/70 bg-rose-500/12 text-rose-700 dark:border-rose-400/40 dark:text-rose-300"
                    : "border-primary/40 bg-primary/12 text-primary"
                  : "border-zinc-500/45 bg-zinc-900/65 text-zinc-100 hover:border-primary/35 dark:border-border dark:bg-card/80 dark:text-foreground/90"
              )}
            >
              <span className="inline-flex min-w-0 items-center gap-1">
                <ChipIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{chip.label}</span>
              </span>
            </button>
          );
        })}
        <label className="relative min-w-0 w-full flex-[1_1_100%] sm:max-w-[14rem] sm:flex-[1_1_auto]">
          <span className="sr-only">{ui.excludeAllergen}</span>
          <select
            value={excludedAllergenCode}
            onChange={(event) => onExcludeAllergenChange(event.target.value)}
            className="min-h-8 w-full rounded-full border border-zinc-500/50 bg-zinc-950/85 px-2 text-[10px] font-medium text-zinc-50 outline-none transition-all duration-200 ease-out focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-card/85 dark:text-foreground"
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
    </div>
  );
}
