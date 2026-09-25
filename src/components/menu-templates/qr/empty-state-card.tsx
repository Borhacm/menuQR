"use client";

import { ImageOff, SearchX } from "lucide-react";
import type { MenuTheme } from "@/components/menu-templates/types";

export function EmptyStateCard({
  icon,
  title,
  hint,
  theme,
  variant = "default",
}: {
  icon: "search" | "items";
  title: string;
  hint: string;
  theme?: MenuTheme;
  variant?: "default" | "grid";
}) {
  const isGrid = variant === "grid";
  return (
    <div
      className={
        isGrid
          ? "rounded-2xl border border-dashed border-border bg-card p-4 text-center"
          : "rounded-2xl border border-dashed border-border/80 bg-card/40 p-4 text-center"
      }
      style={
        theme
          ? {
              borderColor: theme.border,
              backgroundColor: `${theme.surface}99`,
            }
          : undefined
      }
    >
      <div
        className={
          isGrid
            ? "mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            : "mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/80"
        }
      >
        {icon === "search" ? (
          <SearchX className={isGrid ? "h-4.5 w-4.5 text-foreground" : "h-4.5 w-4.5 text-muted-foreground"} />
        ) : (
          <ImageOff className={isGrid ? "h-4.5 w-4.5 text-foreground" : "h-4.5 w-4.5 text-muted-foreground"} />
        )}
      </div>
      <p className={isGrid ? "text-sm font-medium text-foreground" : "text-sm font-medium text-foreground"}>{title}</p>
      <p className={isGrid ? "mt-1 text-xs text-foreground" : "mt-1 text-xs text-muted-foreground"}>{hint}</p>
    </div>
  );
}
