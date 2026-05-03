"use client";

import { cn } from "@/lib/utils";
import type { MenuCategory, MenuTheme } from "@/components/menu-templates/types";

export function CategoryTabs({
  categories,
  activeCategoryId,
  onCategoryChange,
  theme,
}: {
  categories: ReadonlyArray<MenuCategory>;
  activeCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  theme?: MenuTheme;
}) {
  return (
    <div
      className={cn(
        "mb-3 grid gap-2.5",
        categories.length <= 3 ? "grid-cols-3" : "grid-cols-2"
      )}
    >
      {categories.map((category) => {
        const isActive = activeCategoryId === category.id;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
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
  );
}
