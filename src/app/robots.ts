import type { MetadataRoute } from "next";
import { resolveAbsoluteSiteOrigin } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/api/", "/onboarding", "/invite/"] }],
    sitemap: `${resolveAbsoluteSiteOrigin().origin}/sitemap.xml`,
  };
}
