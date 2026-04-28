"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ScanLine, Globe2, ChefHat } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_50%,transparent_100%)]" />
      <div className="absolute inset-0 bg-radial-fade" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t("badge")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {t("title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href="/register">
                {t("ctaPrimary")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-7">
              <Link href="/pricing">{t("ctaSecondary")}</Link>
            </Button>
          </motion.div>

          <p className="mt-6 text-xs uppercase tracking-wider text-muted-foreground">
            {t("trustedBy")}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-14 lg:mt-20"
        >
          <HeroPreview />
        </motion.div>
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="rounded-3xl border border-border/70 bg-card/60 p-3 shadow-2xl backdrop-blur">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <PreviewPhone className="lg:col-span-1" lang="EN" />
          <PreviewMenu className="lg:col-span-2" />
        </div>
      </div>
      <FloatingBadge
        className="absolute -top-4 -left-4"
        icon={<Globe2 className="h-3.5 w-3.5" />}
        text="25+ languages"
      />
      <FloatingBadge
        className="absolute -bottom-4 -right-4"
        icon={<ScanLine className="h-3.5 w-3.5" />}
        text="Unlimited scans"
      />
      <FloatingBadge
        className="absolute top-1/2 -right-6 hidden lg:flex"
        icon={<ChefHat className="h-3.5 w-3.5" />}
        text="AI-translated"
      />
    </div>
  );
}

function PreviewPhone({ className, lang }: { className?: string; lang: string }) {
  return (
    <div
      className={`relative aspect-[9/14] overflow-hidden rounded-2xl bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-900 dark:to-zinc-950 ${className}`}
    >
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              QR Menu
            </p>
            <p className="text-lg font-display font-bold">La Trattoria</p>
          </div>
          <div className="rounded-full bg-background px-2 py-1 text-[10px] font-semibold">
            {lang}
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {["Antipasti", "Pasta", "Pizza", "Dolci"].map((c) => (
            <div
              key={c}
              className="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium"
            >
              {c}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg bg-background p-3 shadow-sm">
          <div className="text-sm font-semibold">Tagliatelle al ragù</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Hand-rolled ribbons in slow beef sauce
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-primary">€14.50</span>
            <span className="text-[10px] uppercase text-muted-foreground">
              Best seller
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMenu({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-50 via-white to-amber-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 ${className}`}
    >
      <div className="grid h-full grid-cols-2 gap-3 p-5">
        {[
          { name: "Bruschetta al pomodoro", price: "€7.20" },
          { name: "Caprese salad", price: "€9.80" },
          { name: "Risotto ai funghi", price: "€16.50" },
          { name: "Tiramisù", price: "€6.50" },
        ].map((d) => (
          <div
            key={d.name}
            className="rounded-xl border border-border/60 bg-background/80 p-3"
          >
            <div className="aspect-video rounded-md bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200" />
            <div className="mt-2.5 text-sm font-semibold">{d.name}</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-bold text-primary">{d.price}</span>
              <span className="text-[10px] rounded-full bg-secondary px-1.5 py-0.5 text-secondary-foreground">
                Vegan
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloatingBadge({
  className,
  icon,
  text,
}: {
  className?: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium shadow-md ${className}`}
    >
      {icon}
      {text}
    </div>
  );
}
