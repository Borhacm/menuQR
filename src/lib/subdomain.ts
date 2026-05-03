/**
 * Subdomain helpers.
 *
 * Routing rules (handled by middleware):
 *   - host = apex or www.<root>                         -> marketing (or skip tenant rewrite)
 *   - host = app.<root>                                 -> admin app (/app/*)
 *   - host = <tenant>.<root> (tenant not reserved)      -> public menu (/_menu/<tenant>)
 *
 * **Multiple roots**: set `NEXT_PUBLIC_ROOT_DOMAINS` (comma-separated). When several roots match,
 * the **longest** one wins — e.g. `menuly.bocal.online` over `bocal.online` so that host
 * `menuly.bocal.online` is apex (tenant slug unset) instead of falsely mapping to tenant `menuly`.
 *
 * In development we treat *.localhost the same way, e.g.
 *   - localhost:3000              -> marketing
 *   - app.localhost:3000          -> admin
 *   - acme.localhost:3000        -> public menu (slug=acme)
 *
 * If wildcard DNS is not available, the public menu is also reachable via the
 * fallback path /m/<slug>.
 */

const RESERVED = new Set(["app", "www", "api", "admin", "static", "assets"]);

export interface HostInfo {
  /** Hostname only, without port. */
  host: string;
  /** Detected leading subdomain (or empty string for apex). */
  subdomain: string;
  /** True if the host is the admin/app subdomain. */
  isApp: boolean;
  /** True if the host represents a tenant menu (subdomain that's not reserved). */
  tenantSlug: string | null;
}

/** Among configured roots that match `host`, return the longest (most specific) label. */
function longestMatchingRoot(host: string, roots: readonly string[]): string | undefined {
  const dot = "." as const;
  const candidates = roots.filter(
    (root) =>
      root.length > 0 && (host === root || host === `www.${root}` || host.endsWith(`${dot}${root}`))
  );
  if (!candidates.length) return undefined;
  return candidates.reduce((best, root) => (root.length > best.length ? root : best));
}

export function parseHost(rawHost: string | undefined | null): HostInfo {
  const host = (rawHost ?? "").split(":")[0].toLowerCase();
  const roots = (process.env.NEXT_PUBLIC_ROOT_DOMAINS ??
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ??
    "menuly.test")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!host) return { host: "", subdomain: "", isApp: false, tenantSlug: null };

  let sub = "";
  const matchedRoot = longestMatchingRoot(host, roots);

  if (matchedRoot && (host === matchedRoot || host === `www.${matchedRoot}`)) {
    sub = "";
  } else if (matchedRoot && host.endsWith(`.${matchedRoot}`)) {
    sub = host.slice(0, -1 - matchedRoot.length);
  } else if (host.endsWith(".localhost")) {
    sub = host.slice(0, -".localhost".length);
  } else if (host === "localhost") {
    sub = "";
  } else {
    sub = "";
  }

  // Multi-level subdomains: take the leftmost segment.
  if (sub.includes(".")) sub = sub.split(".")[0];

  const isApp = sub === "app";
  const isReserved = RESERVED.has(sub) || sub === "";
  const tenantSlug = !isReserved ? sub : null;

  return { host, subdomain: sub, isApp, tenantSlug };
}
