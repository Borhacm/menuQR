export type AllergenLocale = "en" | "es";

const allergenNames: Record<string, { en: string; es: string }> = {
  celery: { en: "Celery", es: "Apio" },
  crustaceans: { en: "Seafood", es: "Mariscos" },
  eggs: { en: "Eggs", es: "Huevos" },
  fish: { en: "Fish", es: "Pescado" },
  gluten: { en: "Gluten", es: "Gluten" },
  lupin: { en: "Lupin", es: "Altramuces" },
  milk: { en: "Milk", es: "Lácteo" },
  molluscs: { en: "Molluscs", es: "Moluscos" },
  mustard: { en: "Mustard", es: "Mostaza" },
  peanuts: { en: "Peanuts", es: "Cacahuetes" },
  sesame: { en: "Sesame", es: "Sésamo" },
  soybeans: { en: "Soybeans", es: "Soja" },
  nuts: { en: "Tree nuts", es: "Frutos secos" },
  sulphites: { en: "Sulphites", es: "Sulfitos" },
  tree_nuts: { en: "Tree nuts", es: "Frutos de cáscara" },
  treenuts: { en: "Tree nuts", es: "Frutos de cáscara" },
  "tree-nuts": { en: "Tree nuts", es: "Frutos de cáscara" },
  crustacean: { en: "Seafood", es: "Mariscos" },
  soybean: { en: "Soybeans", es: "Soja" },
};

const hiddenAllergenCodes = new Set(["sulphites", "molluscs"]);

export function normalizeAllergenCode(code: string): string {
  return code.toLowerCase().trim().replace(/\s+/g, "_");
}

export function hasAllergenLocalization(code: string): boolean {
  return Boolean(allergenNames[normalizeAllergenCode(code)]);
}

export function isVisibleAllergen(code: string | null | undefined): boolean {
  if (!code) return false;
  return !hiddenAllergenCodes.has(normalizeAllergenCode(code));
}

export function getAllergenLocalizationCodes(): string[] {
  return Object.keys(allergenNames);
}

export function localizeAllergenName(
  code: string | null | undefined,
  locale: string,
  fallbackName: string
): string {
  if (!code) return fallbackName;
  const normalizedCode = normalizeAllergenCode(code);
  const dict = allergenNames[normalizedCode];
  if (!dict) return fallbackName;
  return locale.startsWith("es") ? dict.es : dict.en;
}
