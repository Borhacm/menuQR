/**
 * Public URL used for outbound links from menu templates (Menuly mark → landing).
 * Prefer `NEXT_PUBLIC_MARKETING_SITE_URL` once the definitive production hostname/path exists.
 *
 * Fallback to `NEXT_PUBLIC_APP_URL`, then "/", for same-origin dev; on a dedicated menu host
 * you should set MARKETING_SITE explicitly (see PENDIENTES.md).
 */
export function getMarketingSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_MARKETING_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";
  const trimmed = fromEnv.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}
