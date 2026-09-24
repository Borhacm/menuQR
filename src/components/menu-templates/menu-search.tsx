"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { formatPrice } from "@/config/currencies";
import { SoldOutBadge } from "@/components/menu-templates/sold-out-badge";
import type { MenuCategory } from "@/components/menu-templates/types";

const labels = {
  es: { placeholder: "Buscar en la carta", clear: "Borrar búsqueda", none: "No hay platos que coincidan.", results: (n: number) => `${n} resultado${n === 1 ? "" : "s"}` },
  en: { placeholder: "Search the menu", clear: "Clear search", none: "No dishes match your search.", results: (n: number) => `${n} result${n === 1 ? "" : "s"}` },
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * Template-agnostic search: while the guest types (2+ chars) it shows matching dishes from every
 * section; otherwise it renders the venue's template untouched.
 */
export function MenuSearch({
  categories,
  locale,
  currency,
  children,
}: {
  categories: ReadonlyArray<MenuCategory>;
  locale: string;
  currency: string;
  children: ReactNode;
}) {
  const t = locale === "es" ? labels.es : labels.en;
  const [query, setQuery] = useState("");
  const q = normalize(query.trim());

  const results = useMemo(() => {
    if (q.length < 2) return [];
    return categories.flatMap((category) =>
      category.items
        .filter((item) => normalize(`${item.name} ${item.description ?? ""}`).includes(q))
        .map((item) => ({ item, section: category.name }))
    );
  }, [categories, q]);

  return (
    <div>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.placeholder}
          aria-label={t.placeholder}
          className="h-11 w-full rounded-full border border-border bg-card/60 pl-9 pr-10 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={t.clear}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {q.length >= 2 ? (
        <section aria-live="polite" className="space-y-2">
          <p className="text-xs text-muted-foreground">{t.results(results.length)}</p>
          {results.length === 0 ? (
            <p className="rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">{t.none}</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card/60">
              {results.map(({ item, section }) => {
                const price = item.prices.find((p) => p.currency === currency) ?? item.prices[0];
                return (
                  <li key={item.id} className="flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {item.name}
                        <SoldOutBadge label={item.soldOut} />
                      </p>
                      {item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}
                      <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{section}</p>
                    </div>
                    {price ? (
                      <span className="shrink-0 font-semibold text-foreground">
                        {formatPrice(Number(price.amount), price.currency, locale)}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        children
      )}
    </div>
  );
}
