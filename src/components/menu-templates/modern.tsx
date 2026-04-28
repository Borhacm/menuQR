import { formatPrice } from "@/config/currencies";

type Item = {
  id: string;
  name: string;
  description: string | null;
  prices: { id: string; amount: unknown; currency: string }[];
};

export function ModernTemplate({
  title,
  items,
  locale,
}: {
  title: string;
  items: Item[];
  locale: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-100">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.name}</h2>
                {item.description ? (
                  <p className="text-sm text-zinc-400">{item.description}</p>
                ) : null}
              </div>
              <div className="text-right text-sm font-medium text-orange-300">
                {item.prices[0]
                  ? formatPrice(Number(item.prices[0].amount), item.prices[0].currency, locale)
                  : "-"}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
