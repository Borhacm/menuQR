import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { SOLUTIONS } from "@/content/solutions";
import {
  Globe,
  Settings2,
  BarChart3,
  Palette,
  Languages,
  CloudCog,
  Coins,
  QrCode,
} from "lucide-react";

const ICONS = {
  domain: Globe,
  management: Settings2,
  analytics: BarChart3,
  templates: Palette,
  multilingual: Languages,
  media: CloudCog,
  currency: Coins,
  qr: QrCode,
};

export const metadata = { title: "Solutions" };

export default async function SolutionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("SolutionsPage");

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

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SOLUTIONS.map((s) => {
          const Icon = ICONS[s.iconKey];
          return (
            <Link key={s.slug} href={`/solutions/${s.slug}`}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 font-display text-base font-semibold">
                    {t(`items.${s.iconKey}.title`)}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{t(`items.${s.iconKey}.hero`)}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
