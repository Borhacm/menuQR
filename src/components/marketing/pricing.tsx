"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { plans } from "@/config/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuthLink } from "@/components/auth/auth-link";

export function Pricing() {
  const t = useTranslations("Pricing");

  return (
    <section id="pricing" className="bg-muted/30 py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-background p-7 shadow-sm",
                plan.popular
                  ? "border-primary ring-1 ring-primary"
                  : "border-border"
              )}
            >
              {plan.popular ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {t("mostPopular")}
                </span>
              ) : null}

              <div className="flex items-baseline gap-2">
                <h3 className="font-display text-lg font-semibold">{t(`plans.${plan.id}.name`)}</h3>
                {plan.trialDays > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {t("trial", { days: plan.trialDays })}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex items-end gap-1">
                <span className="font-display text-4xl font-bold">
                  €{plan.priceMonthly.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("perMonth")}
                  {plan.priceMonthly > 0 ? ` ${t("vat")}` : ""}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {t(`plans.${plan.id}.description`)}
              </p>

              <ul className="mt-6 space-y-2.5 text-sm">
                {plan.features.map((feature, featureIdx) => (
                  <li key={`${plan.id}-${featureIdx}`} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{t(`plans.${plan.id}.features.${featureIdx}`)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 pt-5 border-t border-border">
                <Button
                  asChild
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  <AuthLink to="/register" query={{ plan: plan.id }}>
                    {t("cta")}
                  </AuthLink>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
