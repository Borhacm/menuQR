"use client";

import { ArrowUp, X } from "lucide-react";
import type { MenuTheme } from "@/components/menu-templates/types";

export function QuickActionsBar({
  show,
  onClear,
  onBackToTop,
  locale,
  theme,
}: {
  show: boolean;
  onClear: () => void;
  onBackToTop: () => void;
  locale: string;
  theme?: MenuTheme;
}) {
  if (!show) return null;
  return (
    <div className="sticky bottom-2 z-20 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onClear}
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
        onClick={onBackToTop}
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
  );
}
