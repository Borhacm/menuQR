"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { formatPrice } from "@/config/currencies";
import { SoldOutBadge } from "@/components/menu-templates/sold-out-badge";
import type { MenuCategory } from "@/components/menu-templates/types";

const labels = {
  es: {
    search: "Buscar en la carta",
    clear: "Cerrar búsqueda",
    none: "No hay platos que coincidan.",
    results: (n: number) => `${n} resultado${n === 1 ? "" : "s"}`,
    language: "Idioma",
    sections: "Secciones de la carta",
  },
  en: {
    search: "Search the menu",
    clear: "Close search",
    none: "No dishes match your search.",
    results: (n: number) => `${n} result${n === 1 ? "" : "s"}`,
    language: "Language",
    sections: "Menu sections",
  },
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * Shared frame for every public menu template: venue name first, compact language switch, and a
 * sticky bar with search plus (for long-scroll templates) section links with scrollspy.
 */
export function PublicMenuShell({
  title,
  locale,
  locales,
  categories,
  currency,
  sectionNav,
  children,
}: {
  title: string;
  locale: string;
  locales: ReadonlyArray<string>;
  categories: ReadonlyArray<MenuCategory>;
  currency: string;
  /** Show section links in the sticky bar (templates that list every section on one page). */
  sectionNav: boolean;
  children: ReactNode;
}) {
  const t = locale === "es" ? labels.es : labels.en;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const q = normalize(query.trim());
  const sections = categories.filter((c) => c.items.length > 0);
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");
  const navRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    if (q.length < 2) return [];
    return categories.flatMap((category) =>
      category.items
        .filter((item) => normalize(`${item.name} ${item.description ?? ""}`).includes(q))
        .map((item) => ({ item, section: category.name }))
    );
  }, [categories, q]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Border under the sticky bar only once it actually sticks.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry?.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scrollspy: highlight the section whose heading last crossed the sticky bar.
  useEffect(() => {
    if (!sectionNav) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-menu-section]"));
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0]?.target.getAttribute("data-menu-section");
        if (id) setActiveSection(id);
      },
      { rootMargin: "-72px 0px -60% 0px" }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sectionNav, categories]);

  // Keep the active chip in view inside the horizontal scroller.
  useEffect(() => {
    const chip = navRef.current?.querySelector<HTMLElement>(`[data-chip="${activeSection}"]`);
    chip?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [activeSection]);

  const localeHref = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("locale", next);
    return `${pathname}?${params.toString()}`;
  };

  const closeSearch = () => {
    setQuery("");
    setSearchOpen(false);
  };

  return (
    <div>
      <header className="px-5 pb-3 pt-9 sm:px-8 sm:pt-12">
        <div className="flex items-start justify-between gap-4">
          <h1 className="min-w-0 text-balance font-display text-[2.1rem] font-bold leading-[1.02] tracking-[-0.025em] sm:text-5xl">
            {title}
          </h1>
          {locales.length > 1 ? (
            <nav aria-label={t.language} className="mt-1.5 flex shrink-0 overflow-hidden rounded-full border border-[var(--menu-border)] text-xs font-semibold">
              {locales.map((code) => {
                const active = code === locale;
                return (
                  <Link
                    key={code}
                    href={localeHref(code)}
                    scroll={false}
                    replace
                    hrefLang={code}
                    aria-current={active ? "true" : undefined}
                    className={
                      active
                        ? "bg-[var(--menu-text)] px-2.5 py-1.5 uppercase text-[var(--menu-bg)]"
                        : "px-2.5 py-1.5 uppercase text-[var(--menu-muted)] hover:text-[var(--menu-text)]"
                    }
                  >
                    {code}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>
      </header>

      <div ref={sentinelRef} aria-hidden className="h-px" />
      <div
        className={
          "sticky top-0 z-30 bg-[var(--menu-bg)] transition-[box-shadow] duration-300 " +
          (stuck ? "shadow-[0_6px_16px_-12px_color-mix(in_srgb,var(--menu-text)_45%,transparent)]" : "")
        }
      >
        <div className="flex items-center gap-2 px-3 py-2.5 sm:px-6">
          {searchOpen ? (
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--menu-muted)]" aria-hidden />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Escape" && closeSearch()}
                placeholder={t.search}
                aria-label={t.search}
                className="h-10 w-full rounded-full border border-[var(--menu-border)] bg-[var(--menu-surface)] pl-9 pr-3 text-base text-[var(--menu-text)] outline-none placeholder:text-[var(--menu-muted)] focus-visible:ring-2 focus-visible:ring-[var(--menu-primary)]"
              />
            </div>
          ) : sectionNav ? (
            <div ref={navRef} className="-my-1 flex flex-1 gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={t.sections} role="navigation">
              {sections.map((section) => {
                const active = section.id === activeSection;
                return (
                  <a
                    key={section.id}
                    href={`#sec-${section.id}`}
                    data-chip={section.id}
                    aria-current={active ? "true" : undefined}
                    onClick={() => setActiveSection(section.id)}
                    className={
                      "shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200 " +
                      (active
                        ? "bg-[var(--menu-text)] text-[var(--menu-bg)]"
                        : "text-[var(--menu-muted)] hover:text-[var(--menu-text)]")
                    }
                  >
                    {section.name}
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <button
            type="button"
            onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            aria-label={searchOpen ? t.clear : t.search}
            aria-expanded={searchOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--menu-border)] text-[var(--menu-text)] hover:bg-[var(--menu-surface)]"
          >
            {searchOpen ? <X className="h-4 w-4" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>

      {q.length >= 2 ? (
        <section aria-live="polite" className="px-5 pb-10 pt-3 sm:px-8">
          <p className="mb-3 text-sm text-[var(--menu-muted)]">{t.results(results.length)}</p>
          {results.length === 0 ? (
            <p className="py-8 text-center text-[var(--menu-muted)]">{t.none}</p>
          ) : (
            <ul className="divide-y divide-[var(--menu-border)]">
              {results.map(({ item, section }) => {
                const price = item.prices.find((p) => p.currency === currency) ?? item.prices[0];
                return (
                  <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {item.name}
                        <SoldOutBadge label={item.soldOut} />
                      </p>
                      {item.description ? <p className="mt-0.5 text-[0.95rem] leading-snug text-[var(--menu-muted)]">{item.description}</p> : null}
                      <p className="mt-1 text-xs text-[var(--menu-muted)]">{section}</p>
                    </div>
                    {price ? (
                      <span className="shrink-0 font-semibold tabular-nums text-[var(--menu-primary)]">
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
