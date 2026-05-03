"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useMemo, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { ClassicTemplate } from "@/components/menu-templates/classic";
import { ModernTemplate } from "@/components/menu-templates/modern";
import { GridTemplate } from "@/components/menu-templates/grid";
import { getMarketingTemplateDemoCategories } from "@/lib/marketing/template-demo-categories";

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    shellClass: "from-amber-50 via-orange-50 to-rose-50",
    phoneClass: "bg-[#f5f1ea] text-zinc-900",
    frameClass: "border-zinc-400/40",
  },
  {
    id: "modern",
    name: "Modern",
    shellClass: "from-zinc-950 via-zinc-900 to-zinc-900",
    phoneClass: "bg-zinc-950 text-zinc-100",
    frameClass: "border-zinc-600/80",
  },
  {
    id: "grid",
    name: "Grid",
    shellClass: "from-indigo-950 via-blue-950 to-zinc-950",
    phoneClass: "bg-[#070b1a] text-slate-100",
    frameClass: "border-blue-300/25",
  },
] as const;

function TemplatePhoneFrame({
  shellClass,
  phoneClass,
  frameClass,
  children,
}: {
  shellClass: string;
  phoneClass: string;
  frameClass: string;
  children: ReactNode;
}) {
  return (
    <div className={`relative aspect-[3/5] overflow-hidden ${shellClass}`}>
      <div
        className={`flex h-full flex-col rounded-[1.8rem] border p-1.5 sm:p-2 ${phoneClass} ${frameClass}`}
      >
        <div className="mx-auto mb-1.5 h-1 w-14 shrink-0 rounded-full bg-zinc-700/80 sm:mb-2 sm:w-16" />
        <div className="min-h-0 flex-1 overflow-hidden rounded-[1.05rem]">
          <div className="flex h-full max-h-full justify-center overflow-x-hidden overflow-y-auto px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* ~0.78 scale + width 128.2% keeps layout width ≈100% after scale; eases locale row + filters */}
            <div className="mx-auto w-[128.205%] max-w-none origin-top scale-[0.78] will-change-transform [transform:translateZ(0)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplatesCarousel() {
  const t = useTranslations("Templates");
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section className="bg-muted/30 py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-12">
          <div
            ref={ref}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TEMPLATES.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                className="snap-start shrink-0 w-[272px] sm:w-[312px]"
              >
                <TemplateCard
                  id={tpl.id}
                  name={tpl.name}
                  shellClass={tpl.shellClass}
                  phoneClass={tpl.phoneClass}
                  frameClass={tpl.frameClass}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TemplateCard({
  id,
  name,
  phoneClass,
  shellClass,
  frameClass,
}: {
  id: string;
  name: string;
  shellClass: string;
  phoneClass: string;
  frameClass: string;
}) {
  const demoCategories = useMemo(() => getMarketingTemplateDemoCategories(), []);

  const inner =
    id === "grid" ? (
      <GridTemplate
        title="La Trattoria"
        categories={demoCategories}
        locale="es"
        locales={["es", "en"]}
        canShowAllergens
      />
    ) : id === "modern" ? (
      <ModernTemplate
        title="La Trattoria"
        categories={demoCategories}
        locale="es"
        locales={["es", "en"]}
        canShowAllergens
        initialCurrency="EUR"
      />
    ) : (
      <ClassicTemplate
        title="La Trattoria"
        categories={demoCategories}
        locale="es"
        locales={["es", "en"]}
        canShowAllergens
        initialCurrency="EUR"
      />
    );

  return (
    <div className="group block transition-all hover:-translate-y-0.5">
      <TemplatePhoneFrame shellClass={shellClass} phoneClass={phoneClass} frameClass={frameClass}>
        {inner}
      </TemplatePhoneFrame>
      <Link href={`/preview/templates/${id}`} className="block px-1 py-2 text-center text-sm font-semibold">
        {name}
      </Link>
    </div>
  );
}
