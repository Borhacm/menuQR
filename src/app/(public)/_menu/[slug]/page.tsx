import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ClassicTemplate } from "@/components/menu-templates/classic";
import { ModernTemplate } from "@/components/menu-templates/modern";
import { GridTemplate } from "@/components/menu-templates/grid";

export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string; currency?: string }>;
}) {
  const { slug } = await params;
  const qs = await searchParams;
  const locale = qs.locale ?? "en";

  const resource = await db.resource.findUnique({
    where: { slug },
    include: {
      menus: {
        include: {
          categories: {
            include: {
              items: {
                include: {
                  prices: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!resource) notFound();

  const menu = resource.menus[0];
  const items = menu?.categories.flatMap((c) => c.items) ?? [];

  const template = resource.templateId;
  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      {template === "modern" ? (
        <ModernTemplate title={resource.name} items={items} locale={locale} />
      ) : template === "grid" ? (
        <GridTemplate title={resource.name} items={items} locale={locale} />
      ) : (
        <ClassicTemplate title={resource.name} items={items} locale={locale} />
      )}
    </main>
  );
}
