import { formatPrice } from "@/config/currencies";
import type { MenuCategory, MenuTheme } from "@/components/menu-templates/types";

export function ClassicTemplate({
  title,
  categories,
  locale,
  theme,
}: {
  title: string;
  categories: ReadonlyArray<MenuCategory>;
  locale: string;
  theme?: MenuTheme;
}) {
  const items = categories.flatMap((category) => category.items);
  return (
    <div
      className="space-y-4 rounded-2xl border p-4"
      style={
        theme
          ? {
              backgroundColor: theme.background,
              color: theme.text,
              borderColor: theme.border,
            }
          : undefined
      }
    >
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border p-4"
            style={
              theme
                ? {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  }
                : undefined
            }
          >
            <h2 className="font-semibold">{item.name}</h2>
            {item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {item.prices.map((p) => (
                <span
                  key={p.id}
                  className="rounded-full px-2 py-0.5"
                  style={
                    theme
                      ? {
                          color: theme.primary,
                          backgroundColor: `${theme.primary}1A`,
                        }
                      : undefined
                  }
                >
                  {formatPrice(Number(p.amount), p.currency, locale)}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
