/**
 * Subdomain helpers.
 *
 * Routing rules (handled by middleware):
 *   - host = ROOT_DOMAIN or www.ROOT_DOMAIN  -> marketing site
 *   - host = app.ROOT_DOMAIN                 -> admin app (/app/*)
 *   - host = <slug>.ROOT_DOMAIN              -> public menu (/_menu/<slug>)
 *
 * In development we treat *.localhost the same way, e.g.
 *   - localhost:3000              -> marketing
 *   - app.localhost:3000          -> admin
 *   - acme.localhost:3000         -> public menu (slug=acme)
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

export function parseHost(rawHost: string | undefined | null): HostInfo {
  const host = (rawHost ?? "").split(":")[0].toLowerCase();
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "menuly.test").toLowerCase();

  if (!host) return { host: "", subdomain: "", isApp: false, tenantSlug: null };

  // Strip ROOT_DOMAIN suffix if present
  let sub = "";
  if (host === root || host === `www.${root}`) {
    sub = "";
  } else if (host.endsWith(`.${root}`)) {
    sub = host.slice(0, -1 - root.length);
  } else if (host.endsWith(".localhost")) {
    sub = host.slice(0, -".localhost".length);
  } else if (host === "localhost") {
    sub = "";
  } else {
    // Unknown host – assume root
    sub = "";
  }

  // Multi-level subdomains: take the leftmost segment.
  if (sub.includes(".")) sub = sub.split(".")[0];

  const isApp = sub === "app";
  const isReserved = RESERVED.has(sub) || sub === "";
  const tenantSlug = !isReserved ? sub : null;

  return { host, subdomain: sub, isApp, tenantSlug };
}
