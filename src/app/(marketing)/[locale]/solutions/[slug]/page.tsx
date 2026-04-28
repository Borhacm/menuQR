import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { SOLUTIONS } from "@/content/solutions";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Settings2,
  BarChart3,
  Palette,
  Languages,
  CloudCog,
  Coins,
  QrCode,
  Check,
  ArrowRight,
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

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const sol = SOLUTIONS.find((s) => s.slug === slug);
  if (!sol) notFound();

  const Icon = ICONS[sol.iconKey];

  return (
    <>
      <section className="container mx-auto px-4 pt-20 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {sol.title}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">{sol.hero}</p>
        </div>
      </section>

      <section className="container mx-auto grid grid-cols-1 gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-base text-muted-foreground leading-relaxed">
            {sol.description}
          </p>
          <ul className="mt-7 space-y-3">
            {sol.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-3">
            <Button asChild>
              <Link href="/register">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
          <div className="absolute inset-6 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg bg-background/80 p-4 backdrop-blur shadow-sm"
              >
                <div className="h-2 w-1/2 rounded-full bg-muted" />
                <div className="mt-2 h-2 w-3/4 rounded-full bg-muted" />
                <div className="mt-2 h-2 w-2/3 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
