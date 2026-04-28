import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
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
