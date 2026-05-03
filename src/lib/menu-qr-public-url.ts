/**
 * Base URL embedded in QR codes for scanning the public `/m/<slug>` menu.
 *
 * Prefer `NEXT_PUBLIC_PUBLIC_MENU_URL` when the admin app (`NEXT_PUBLIC_APP_URL`) runs on another
 * origin than the canonical menu hostname.
 */
export function getMenuQrBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_PUBLIC_MENU_URL?.trim();
  const fallback = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";
  const base = explicit || fallback;
  return base.replace(/\/+$/, "");
}
