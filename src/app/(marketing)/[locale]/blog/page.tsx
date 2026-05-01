import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { POSTS } from "@/content/blog";

export const metadata = { title: "Blog" };

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("BlogPage");

  return (
    <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-5 text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {POSTS.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="group block"
          >
            <Card className="h-full overflow-hidden transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
              <div className={`aspect-[16/9] bg-gradient-to-br ${p.gradient}`} />
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {new Date(p.date).toLocaleDateString(locale)}
                </div>
                <h2 className="mt-2 font-display text-lg font-semibold group-hover:text-primary">
                  {t(`posts.${p.slug}.title`)}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  {t(`posts.${p.slug}.excerpt`)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
