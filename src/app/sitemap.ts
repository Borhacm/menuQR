import type { MetadataRoute } from "next";
import { resolveAbsoluteSiteOrigin } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolveAbsoluteSiteOrigin().origin;
  const routes = [
    "",
    "/pricing",
    "/faq",
    "/contacts",
    "/solutions",
  ];
  const unlocalizedRoutes = ["/register", "/legal", "/legal/privacy", "/legal/terms"];
  const now = new Date();
  return [
    ...routes.flatMap((route) => [
      { url: `${base}${route || "/"}`, lastModified: now },
      { url: `${base}/es${route}`, lastModified: now },
    ]),
    ...unlocalizedRoutes.map((route) => ({ url: `${base}${route}`, lastModified: now })),
  ];
}
