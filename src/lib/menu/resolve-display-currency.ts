/**
 * Picks which currency label to display when the UI offers no selector.
 * Priority: explicit default from resource → optional URL param → first seen in catalog → EUR.
 */
export function resolveMenuDisplayCurrency(
  initialCurrency: string | undefined,
  currencyFromUrl: string | null,
  available: ReadonlyArray<string>
): string {
  const trimmedResource = initialCurrency?.trim();
  if (trimmedResource && available.includes(trimmedResource)) return trimmedResource;
  const trimmedUrl = currencyFromUrl?.trim() ?? "";
  if (trimmedUrl && available.includes(trimmedUrl)) return trimmedUrl;
  return available[0] ?? "EUR";
}
