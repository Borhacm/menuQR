import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ClassicTemplate } from "@/components/menu-templates/classic";
import { ModernTemplate } from "@/components/menu-templates/modern";
import { GridTemplate } from "@/components/menu-templates/grid";
import type { MenuCategory } from "@/components/menu-templates/types";

type TemplateKey = "classic" | "modern" | "grid";

const DEMO_CATEGORIES: MenuCategory[] = [
  {
    id: "starters",
    name: "Entrantes",
    description: "Para abrir el apetito",
    items: [
      {
        id: "item-1",
        name: "Burrata con pesto",
        description: "Tomate cherry, albahaca fresca y aceite de oliva",
        isFeatured: true,
        prices: [{ id: "p-1", amount: 12.5, currency: "EUR" }],
      },
      {
        id: "item-2",
        name: "Croquetas ibéricas",
        description: "Cremosas y crujientes",
        isFeatured: false,
        prices: [{ id: "p-2", amount: 8.5, currency: "EUR" }],
      },
    ],
  },
  {
    id: "mains",
    name: "Principales",
    description: "Nuestros favoritos de la casa",
    items: [
      {
        id: "item-3",
        name: "Tagliatelle al ragú",
        description: "Pasta artesanal cocinada a fuego lento",
        isFeatured: true,
        prices: [{ id: "p-3", amount: 14.5, currency: "EUR" }],
      },
      {
        id: "item-4",
        name: "Pizza Trufa",
        description: "Mozzarella fior di latte, setas y trufa",
        isFeatured: false,
        prices: [{ id: "p-4", amount: 15.9, currency: "EUR" }],
      },
    ],
  },
];

function isTemplate(value: string): value is TemplateKey {
  return value === "classic" || value === "modern" || value === "grid";
}

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ locale: string; template: string }>;
}) {
  const { locale, template } = await params;
  setRequestLocale(locale);
  if (!isTemplate(template)) notFound();

  return (
    <main className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(["classic", "modern", "grid"] as const).map((key) => (
          <Link
            key={key}
            href={`/${locale}/preview/templates/${key}`}
            className={
              key === template
                ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-xs font-semibold uppercase text-primary-foreground"
                : "rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground"
            }
          >
            {key}
          </Link>
        ))}
      </div>

      {template === "modern" ? (
        <ModernTemplate
          title="La Trattoria"
          categories={DEMO_CATEGORIES.map((category) => ({
            ...category,
            items: category.items.map((item): MenuCategory["items"][number] => ({
              ...item,
              isVegan: item.isVegan ?? false,
              isVegetarian: item.isVegetarian ?? false,
              isGlutenFree: item.isGlutenFree ?? false,
              isSpicy: item.isSpicy ?? false,
              images: item.images ?? [],
              allergens: item.allergens ?? [],
              prices: item.prices.map((price) => ({ ...price })),
            })),
          }))}
          locale="es"
          locales={["es", "en"]}
        />
      ) : template === "grid" ? (
        <GridTemplate
          title="La Trattoria"
          categories={DEMO_CATEGORIES.map((category) => ({
            ...category,
            items: category.items.map((item): MenuCategory["items"][number] => ({
              ...item,
              isVegan: item.isVegan ?? false,
              isVegetarian: item.isVegetarian ?? false,
              isGlutenFree: item.isGlutenFree ?? false,
              isSpicy: item.isSpicy ?? false,
              images: item.images ?? [],
              allergens: item.allergens ?? [],
              prices: item.prices.map((price) => ({ ...price })),
            })),
          }))}
          locale="es"
        />
      ) : (
        <ClassicTemplate
          title="La Trattoria"
          categories={DEMO_CATEGORIES.map((category) => ({
            ...category,
            items: category.items.map((item): MenuCategory["items"][number] => ({
              ...item,
              isVegan: item.isVegan ?? false,
              isVegetarian: item.isVegetarian ?? false,
              isGlutenFree: item.isGlutenFree ?? false,
              isSpicy: item.isSpicy ?? false,
              images: item.images ?? [],
              allergens: item.allergens ?? [],
              prices: item.prices.map((price) => ({ ...price })),
            })),
          }))}
          locale="es"
        />
      )}
    </main>
  );
}
