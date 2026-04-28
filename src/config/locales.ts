export const locales = ["en", "es"] as const;
export const defaultLocale = "en" as const;
export type Locale = (typeof locales)[number];

// Languages a Resource can enable for its public menu (translatable via AI).
// This is a curated, larger list than the marketing site locales.
export const menuLocales = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "sv", name: "Svenska", flag: "🇸🇪" },
  { code: "fi", name: "Suomi", flag: "🇫🇮" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "hr", name: "Hrvatski", flag: "🇭🇷" },
  { code: "sl", name: "Slovenščina", flag: "🇸🇮" },
  { code: "bg", name: "Български", flag: "🇧🇬" },
  { code: "et", name: "Eesti", flag: "🇪🇪" },
  { code: "lv", name: "Latviešu", flag: "🇱🇻" },
  { code: "lt", name: "Lietuvių", flag: "🇱🇹" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "ca", name: "Català", flag: "🏴" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
] as const;

export type MenuLocaleCode = (typeof menuLocales)[number]["code"];
