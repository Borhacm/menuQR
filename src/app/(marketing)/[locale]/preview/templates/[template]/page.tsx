import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ClassicTemplate } from "@/components/menu-templates/classic";
import { ModernTemplate } from "@/components/menu-templates/modern";
import { GridTemplate } from "@/components/menu-templates/grid";
import { getMarketingTemplateDemoCategories } from "@/lib/marketing/template-demo-categories";

type TemplateKey = "classic" | "modern" | "grid";

const DEMO_CATEGORIES = getMarketingTemplateDemoCategories();

function isTemplate(value: string): value is TemplateKey {
  return value === "classic" || value === "modern" || value === "grid";
}

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ locale: string; template: string }>;
}) {
  const { locale, template } = await params;
  setRequestLocale(locale);
  if (!isTemplate(template)) notFound();

  return (
    <main className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(["classic", "modern", "grid"] as const).map((key) => (
          <Link
            key={key}
            href={`/${locale}/preview/templates/${key}`}
            className={
              key === template
                ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-xs font-semibold uppercase text-primary-foreground"
                : "rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground"
            }
          >
            {key}
          </Link>
        ))}
      </div>

      {template === "modern" ? (
        <ModernTemplate
          title="La Trattoria"
          categories={DEMO_CATEGORIES}
          locale="es"
          locales={["es", "en"]}
        />
      ) : template === "grid" ? (
        <GridTemplate
          title="La Trattoria"
          categories={DEMO_CATEGORIES}
          locale="es"
          locales={["es", "en"]}
          canShowAllergens
        />
      ) : (
        <ClassicTemplate
          title="La Trattoria"
          categories={DEMO_CATEGORIES}
          locale="es"
          locales={["es", "en"]}
          canShowAllergens
          initialCurrency="EUR"
        />
      )}
    </main>
  );
}
