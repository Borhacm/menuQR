"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AuthLink } from "@/components/auth/auth-link";
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
              <AuthLink to="/register" data-testid="hero-start-free">
                {t("ctaPrimary")} <ArrowRight className="h-4 w-4" />
              </AuthLink>
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
  const t = useTranslations("Hero.preview");
  const locale = useLocale();

  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="grid items-start justify-center gap-6 sm:grid-cols-2">
        <div className="mx-auto w-full max-w-[330px]">
          <PreviewAdminPhone />
        </div>
        <div className="mx-auto w-full max-w-[330px]">
          <PreviewPhone lang={locale.toUpperCase()} />
        </div>
      </div>
      <FloatingBadge
        className="absolute -top-4 left-2 sm:left-0"
        icon={<Globe2 className="h-3.5 w-3.5" />}
        text={t("badgeLanguages")}
      />
      <FloatingBadge
        className="absolute -bottom-4 right-2 sm:right-0"
        icon={<ScanLine className="h-3.5 w-3.5" />}
        text={t("badgeScans")}
      />
      <FloatingBadge
        className="absolute top-1/2 -right-4 hidden xl:flex"
        icon={<ChefHat className="h-3.5 w-3.5" />}
        text={t("badgeAi")}
      />
    </div>
  );
}

function PreviewPhone({ className, lang }: { className?: string; lang: string }) {
  const t = useTranslations("Hero.preview");

  return (
    <div
      className={`relative overflow-hidden rounded-[2.3rem] border border-zinc-700 bg-zinc-950 p-2 shadow-[0_25px_80px_hsl(0_0%_0%/0.55)] ${className}`}
    >
      <div className="mx-auto h-1.5 w-20 rounded-full bg-zinc-700/80" />
      <div className="mt-2 aspect-[9/18] overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                {t("phone.menuLabel")}
              </p>
              <p className="text-lg font-display font-bold text-zinc-100">La Trattoria</p>
            </div>
            <div className="rounded-full bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-100">
              {lang}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {["category1", "category2", "category3", "category4"].map((categoryKey) => (
              <div
                key={categoryKey}
                className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-center text-xs font-medium text-zinc-200"
              >
                {t(`phone.${categoryKey}`)}
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { name: "Bruschetta al pomodoro", price: "€7.20", image: "/images/dishes/bruschetta.jpg" },
              { name: "Risotto ai funghi", price: "€12.90", image: "/images/dishes/risotto.jpg" },
            ].map((dish) => (
              <div key={dish.name} className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-1.5">
                <Image
                  src={dish.image}
                  alt={dish.name}
                  width={320}
                  height={240}
                  className="aspect-[4/3] w-full rounded-md object-cover"
                  loading="lazy"
                />
                <p className="mt-1 text-[11px] font-semibold text-zinc-100">{dish.name}</p>
                <p className="text-[11px] font-bold text-primary">{dish.price}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-zinc-700 bg-zinc-900 p-3">
            <div className="text-sm font-semibold text-zinc-100">Tagliatelle al ragù</div>
            <div className="mt-0.5 text-xs text-zinc-400">{t("phone.dishDescription")}</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-primary">€14.50</span>
              <span className="text-[10px] uppercase text-zinc-500">{t("phone.bestSeller")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewAdminPhone() {
  const t = useTranslations("Hero.preview.admin");

  return (
    <div className="relative overflow-hidden rounded-[2.3rem] border border-zinc-700 bg-zinc-950 p-2 shadow-[0_25px_80px_hsl(0_0%_0%/0.55)]">
      <div className="mx-auto h-1.5 w-20 rounded-full bg-zinc-700/80" />
      <div className="mt-2 aspect-[9/18] overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">{t("label")}</p>
              <p className="text-lg font-display font-bold text-zinc-100">{t("title")}</p>
            </div>
            <div className="rounded-full bg-primary/20 px-2 py-1 text-[10px] font-semibold text-primary">
              {t("live")}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2">
              <p className="text-[10px] uppercase text-zinc-500">{t("fields.nameLabel")}</p>
              <p className="text-sm font-medium text-zinc-100">{t("fields.nameValue")}</p>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2">
              <p className="text-[10px] uppercase text-zinc-500">{t("fields.descriptionLabel")}</p>
              <p className="text-sm text-zinc-200">{t("fields.descriptionValue")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2">
                <p className="text-[10px] uppercase text-zinc-500">{t("fields.priceLabel")}</p>
                <p className="text-sm font-semibold text-primary">€16.90</p>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2">
                <p className="text-[10px] uppercase text-zinc-500">{t("fields.currencyLabel")}</p>
                <p className="text-sm font-semibold text-zinc-100">EUR</p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-primary/50 bg-primary/10 p-3">
            <p className="text-xs font-medium text-primary">{t("uploadCta")}</p>
            <p className="mt-1 text-[11px] text-zinc-400">{t("uploadHelp")}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200"
            >
              {t("actions.saveDraft")}
            </button>
            <button
              type="button"
              className="rounded-lg border border-primary/70 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              {t("actions.publish")}
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900/70 p-2">
            <p className="text-[10px] uppercase text-zinc-500">{t("recentLabel")}</p>
            <div className="mt-2 space-y-1.5">
              {[t("recentItems.0"), t("recentItems.1"), t("recentItems.2")].map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-md bg-zinc-900 px-2 py-1.5"
                >
                  <span className="text-xs text-zinc-200">{name}</span>
                  <span className="text-[10px] text-zinc-500">ok</span>
                </div>
              ))}
            </div>
          </div>
        </div>
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
