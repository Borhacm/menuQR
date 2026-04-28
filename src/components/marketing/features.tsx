"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
import { motion } from "framer-motion";

const FEATURES = [
  { key: "domain", slug: "personalized-domain", Icon: Globe },
  { key: "management", slug: "easy-menu-management", Icon: Settings2 },
  { key: "analytics", slug: "analytics", Icon: BarChart3 },
  { key: "templates", slug: "flexible-design", Icon: Palette },
  { key: "multilingual", slug: "multilingual-menus", Icon: Languages },
  { key: "media", slug: "media-asset", Icon: CloudCog },
  { key: "currency", slug: "multi-currency", Icon: Coins },
  { key: "qr", slug: "qr-code-generator", Icon: QrCode },
] as const;

export function Features() {
  const t = useTranslations("Features");

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

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ key, slug, Icon }, idx) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: idx * 0.04 }}
          >
            <Link
              href={`/solutions/${slug}`}
              className="group block h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`items.${key}.description`)}
              </p>
              <span className="mt-4 inline-flex text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Learn more →
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
