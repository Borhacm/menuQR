import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { parseHost } from "@/lib/subdomain";

const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { isApp, tenantSlug } = parseHost(req.headers.get("host"));
  const isSystemPath =
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/favicon.ico") ||
    url.pathname.startsWith("/robots.txt") ||
    url.pathname.startsWith("/sitemap.xml") ||
    url.pathname.startsWith("/uploads");

  // 1) Tenant menu via subdomain → rewrite to internal /_menu/<slug>
  if (tenantSlug && !isSystemPath && !url.pathname.startsWith("/_menu/")) {
    const rewriteUrl = new URL(req.url);
    rewriteUrl.pathname = `/_menu/${tenantSlug}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  // 2) Admin via app.* subdomain → rewrite "/" to "/app"
  if (isApp) {
    if (url.pathname === "/") {
      const rewriteUrl = new URL(req.url);
      rewriteUrl.pathname = "/app";
      return NextResponse.rewrite(rewriteUrl);
    }
    return NextResponse.next();
  }

  // 3) Marketing site: skip i18n on app/auth/api/menu paths
  const skip =
    url.pathname.startsWith("/app") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/register") ||
    url.pathname.startsWith("/verify") ||
    url.pathname.startsWith("/invite") ||
    url.pathname.startsWith("/onboarding") ||
    url.pathname.startsWith("/m/") ||
    url.pathname.startsWith("/_menu/") ||
    url.pathname.startsWith("/api");

  if (skip) return NextResponse.next();

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|uploads|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|js|css|woff2?)).*)",
  ],
};
