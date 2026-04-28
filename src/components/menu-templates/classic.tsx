import { formatPrice } from "@/config/currencies";

type Item = {
  id: string;
  name: string;
  description: string | null;
  prices: { id: string; amount: unknown; currency: string }[];
};

export function ClassicTemplate({
  title,
  items,
  locale,
}: {
  title: string;
  items: Item[];
  locale: string;
}) {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border p-4">
            <h2 className="font-semibold">{item.name}</h2>
            {item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {item.prices.map((p) => (
                <span key={p.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
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
