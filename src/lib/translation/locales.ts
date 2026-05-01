const defaultPrimaryLocales = ["en", "es", "fr", "de", "it", "pt", "ca", "ko"] as const;
const defaultSecondaryLocales = ["en", "es", "nl", "ru"] as const;

function parseLocaleCsv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function getPrimaryTranslationLocales(): string[] {
  const primaryUrl = process.env.LIBRETRANSLATE_URL?.trim();
  if (!primaryUrl) return [];
  const configured = parseLocaleCsv(process.env.LIBRETRANSLATE_PRIMARY_LOCALES);
  return configured.length ? configured : [...defaultPrimaryLocales];
}

export function getSecondaryTranslationLocales(): string[] {
  const secondaryUrl = process.env.LIBRETRANSLATE_URL_SECONDARY?.trim();
  if (!secondaryUrl) return [];
  const configured = parseLocaleCsv(process.env.LIBRETRANSLATE_SECONDARY_LOCALES);
  return configured.length ? configured : [...defaultSecondaryLocales];
}

export function getConfiguredTranslationLocales(): Set<string> {
  return new Set([...getPrimaryTranslationLocales(), ...getSecondaryTranslationLocales()]);
}

export function isTranslationLocaleConfigured(locale: string): boolean {
  return getConfiguredTranslationLocales().has(locale.trim().toLowerCase());
}
