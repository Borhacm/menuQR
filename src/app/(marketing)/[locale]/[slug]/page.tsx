import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { locales, type Locale } from "@/config/locales";

/**
 * Friendly shortcut: /es/mi-restaurante → /m/mi-restaurante?locale=es
 * Public menus live under /m/<slug>; marketing uses /[locale]/… so bare /es/<slug> would 404 otherwise.
 */
export default async function LocalePrefixedMenuShortcutPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as Locale)) {
    notFound();
  }
  if (typeof slug !== "string" || !slug.trim()) {
    notFound();
  }

  const resource = await db.resource.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!resource) {
    notFound();
  }

  redirect(`/m/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`);
}
