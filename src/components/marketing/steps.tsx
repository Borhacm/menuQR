"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export function Steps() {
  const t = useTranslations("Steps");
  const items = t.raw("items") as Array<{ title: string; description: string }>;

  return (
    <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          {t("eyebrow")}
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {items.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.06 }}
            className="relative rounded-2xl border border-border bg-card p-7 shadow-sm"
          >
            <span className="absolute -right-2 -top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background font-display text-sm font-bold text-primary shadow-sm">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display text-lg font-semibold">{step.title}</h3>
            <p className="mt-3 text-sm text-muted-foreground">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
