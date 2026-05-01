"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ChefHat, Languages, BarChart3, QrCode, Grid3x3, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SCREENS = [
  { key: "dashboard", Icon: BarChart3, href: "/app" },
  { key: "menuEditor", Icon: ChefHat, href: "/app/items" },
  { key: "translations", Icon: Languages, href: "/app/translations" },
  { key: "qrBuilder", Icon: QrCode, href: "/app/qr" },
  { key: "items", Icon: Grid3x3, href: "/app/items" },
  { key: "resource", Icon: Settings, href: "/app/settings" },
] as const;

export function AdminPreview() {
  const t = useTranslations("AdminPreview");
  const navLabels = SCREENS.map((screen) => ({
    key: screen.key,
    label: t(`screens.${screen.key}.title`),
  }));

  return (
    <section className="bg-muted/30 py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("subtitle")}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/app"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t("ctaOpenPanel")}
            </Link>
            <span className="text-xs text-muted-foreground">{t("noteAuth")}</span>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SCREENS.map(({ key, Icon, href }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="group"
            >
              <Link
                href={href}
                className="relative block overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs text-muted-foreground">
                    app.menuly.app
                  </span>
                </div>
                <div className="grid min-h-52 grid-cols-[76px_1fr]">
                  <aside className="border-r border-border/60 bg-muted/20 p-2">
                    <div className="space-y-1">
                      {navLabels.map((item) => (
                        <div
                          key={`${key}-${item.key}`}
                          className={cn(
                            "truncate rounded px-1.5 py-1 text-[10px]",
                            item.key === key
                              ? "bg-primary/15 font-semibold text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </aside>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4 text-primary" />
                      {t(`screens.${key}.title`)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{t(`screens.${key}.body`)}</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[0, 1, 2].map((idx) => (
                        <span
                          key={`${key}-chip-${idx}`}
                          className="rounded-full border border-border/70 bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {t(`screens.${key}.chips.${idx}`)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 space-y-2">
                      {[0, 1, 2].map((idx) => (
                        <div
                          key={`${key}-row-${idx}`}
                          className="flex items-center justify-between rounded-md border border-border/70 bg-card/60 px-2 py-1.5 text-[11px]"
                        >
                          <span className="text-foreground/90">{t(`screens.${key}.rows.${idx}`)}</span>
                          <span
                            className={`h-1.5 rounded-full ${idx === 0 ? "w-10 bg-primary/70" : idx === 1 ? "w-8 bg-primary/50" : "w-6 bg-primary/35"}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
