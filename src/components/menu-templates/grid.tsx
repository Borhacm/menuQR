import { formatPrice } from "@/config/currencies";

type Item = {
  id: string;
  name: string;
  description: string | null;
  prices: { id: string; amount: unknown; currency: string }[];
};

export function GridTemplate({
  title,
  items,
  locale,
}: {
  title: string;
  items: Item[];
  locale: string;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold">{item.name}</h2>
            {item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}
            <div className="mt-2 text-sm font-medium text-primary">
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
