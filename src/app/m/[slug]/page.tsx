import { redirect } from "next/navigation";
import PublicMenuPage from "@/app/(public)/_menu/[slug]/page";

function getLegacySlugMap() {
  const raw = process.env.LEGACY_SLUG_MAP_JSON;
  if (!raw) return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed;
  } catch {
    return {} as Record<string, string>;
  }
}

export default async function LegacyAwareMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string; currency?: string; template?: string }>;
}) {
  const { slug } = await params;
  const map = getLegacySlugMap();
  const nextSlug = map[slug];
  if (nextSlug && nextSlug !== slug) {
    redirect(`/m/${nextSlug}?source=qr`);
  }
  return PublicMenuPage({
    params: Promise.resolve({ slug }),
    searchParams,
  });
}
