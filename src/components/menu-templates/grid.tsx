import { formatPrice } from "@/config/currencies";
import type { MenuCategory, MenuTheme } from "@/components/menu-templates/types";

export function GridTemplate({
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
      className="rounded-2xl border p-4"
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
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
            <div className="mt-2 text-sm font-medium" style={theme ? { color: theme.primary } : undefined}>
              {item.prices[0]
                ? formatPrice(Number(item.prices[0].amount), item.prices[0].currency, locale)
                : "-"}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
