import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Default when env is unset; avoid invalid URLs that break `metadataBase` (500 on every route). */
const DEFAULT_SITE_URL = "http://localhost:3000";

/** Absolute origin for URLs and metadataBase; falls back safely on empty or malformed env. */
export function resolveAbsoluteSiteOrigin(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (!raw) return new URL(DEFAULT_SITE_URL);
  try {
    const parsed = new URL(raw);
    // `metadataBase` must be an origin only; a path (e.g. …/es) can break OG/metadata URL resolution in Next.js.
    return new URL(parsed.origin);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export function absoluteUrl(path = "") {
  const base = resolveAbsoluteSiteOrigin().origin;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function formatNumber(n: number, locale = "en") {
  return new Intl.NumberFormat(locale).format(n);
}

export function hashIp(ip: string): string {
  // Lightweight non-cryptographic hash used purely to bucket returning visitors
  // without storing raw IPs in analytics.
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (h * 31 + ip.charCodeAt(i)) | 0;
  }
  return `h${(h >>> 0).toString(36)}`;
}
