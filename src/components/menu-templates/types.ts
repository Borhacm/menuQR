export type MenuPrice = {
  id: string;
  amount: unknown;
  currency: string;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  isFeatured?: boolean;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  images?: { id: string; url: string; alt: string | null }[];
  allergens?: { allergen: { id: string; code?: string; name: string; icon: string | null } }[];
  prices: ReadonlyArray<MenuPrice>;
};

export type MenuCategory = {
  id: string;
  name: string;
  description: string | null;
  items: ReadonlyArray<MenuItem>;
};

export type MenuTheme = {
  primary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  fontFamily?: string;
  density?: "comfortable" | "compact" | string;
};

