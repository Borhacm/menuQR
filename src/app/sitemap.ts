import type { MetadataRoute } from "next";
import { resolveAbsoluteSiteOrigin } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolveAbsoluteSiteOrigin().origin;
  const routes = [
    "",
    "/pricing",
    "/faq",
    "/contacts",
    "/blog",
    "/solutions",
    "/login",
    "/register",
    "/legal",
    "/legal/privacy",
    "/legal/terms",
  ];
  return routes.flatMap((route) => [
    { url: `${base}/en${route}`, lastModified: new Date() },
    { url: `${base}/es${route}`, lastModified: new Date() },
  ]);
}
