import { notFound } from "next/navigation";
import { renderPublicMenuPage } from "@/app/(public)/_menu/render-public-menu";

export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string; currency?: string; template?: string }>;
}) {
  const { slug } = await params;
  if (typeof slug !== "string" || !slug.trim()) {
    notFound();
  }
  return renderPublicMenuPage({ slug, searchParams });
}
