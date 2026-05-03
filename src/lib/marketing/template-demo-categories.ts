import type { MenuCategory } from "@/components/menu-templates/types";

const MARKETING_TEMPLATE_DEMO_CATEGORIES_RAW: ReadonlyArray<{
  id: string;
  name: string;
  description: string;
  items: ReadonlyArray<{
    id: string;
    name: string;
    description: string;
    isFeatured?: boolean;
    prices: ReadonlyArray<{ id: string; amount: number; currency: string }>;
    images?: ReadonlyArray<{ id: string; url: string; alt: string | null }>;
  }>;
}> = [
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
        images: [{ id: "demo-img-1", url: "/images/dishes/caprese.jpg", alt: "Burrata con pesto" }],
      },
      {
        id: "item-2",
        name: "Croquetas ibéricas",
        description: "Cremosas y crujientes",
        isFeatured: false,
        prices: [{ id: "p-2", amount: 8.5, currency: "EUR" }],
        images: [{ id: "demo-img-2", url: "/images/dishes/bruschetta.jpg", alt: "Croquetas ibéricas" }],
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
        images: [{ id: "demo-img-3", url: "/images/dishes/risotto.jpg", alt: "Tagliatelle al ragú" }],
      },
      {
        id: "item-4",
        name: "Pizza Trufa",
        description: "Mozzarella fior di latte, setas y trufa",
        isFeatured: false,
        prices: [{ id: "p-4", amount: 15.9, currency: "EUR" }],
        images: [{ id: "demo-img-4", url: "/images/dishes/tiramisu.jpg", alt: "Pizza Trufa" }],
      },
    ],
  },
];

export function getMarketingTemplateDemoCategories(): MenuCategory[] {
  return MARKETING_TEMPLATE_DEMO_CATEGORIES_RAW.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    items: category.items.map(
      (item): MenuCategory["items"][number] => ({
        id: item.id,
        name: item.name,
        description: item.description,
        isFeatured: item.isFeatured,
        isVegan: false,
        isVegetarian: false,
        isSpicy: false,
        images: item.images?.map((img) => ({ ...img })) ?? [],
        allergens: [],
        prices: item.prices.map((price) => ({ ...price })),
      })
    ),
  }));
}
