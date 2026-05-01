"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function Trust() {
  const t = useTranslations("Trust");
  const items = t.raw("items") as Array<{ title: string; description: string }>;

  return (
    <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-muted-foreground">{t("intro")}</p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item, i) => (
            <motion.li
              key={item.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="group rounded-xl border border-border/70 bg-card/70 p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-transform group-hover:scale-105" />
                <div>
                  <h3 className="font-display text-base font-semibold leading-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
