"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRef } from "react";
import { Link } from "@/i18n/navigation";

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    shellClass: "from-amber-50 via-orange-50 to-rose-50",
    phoneClass: "bg-[#f5f1ea] text-zinc-900",
    frameClass: "border-zinc-400/40",
    chipClass: "border-zinc-500/40 bg-[#f2ede4]",
    cardClass: "border-zinc-500/40 bg-[#f7f3ec]",
    accentClass: "text-amber-700",
    featuredCardClass: "border-zinc-500/40 bg-[#f7f3ec]",
    titleClass: "text-zinc-900",
    metaClass: "text-zinc-600",
    bodyClass: "text-zinc-600",
  },
  {
    id: "modern",
    name: "Modern",
    shellClass: "from-zinc-950 via-zinc-900 to-zinc-900",
    phoneClass: "bg-zinc-950 text-zinc-100",
    frameClass: "border-zinc-600/80",
    chipClass: "border-zinc-600/70 bg-zinc-900/60",
    cardClass: "border-zinc-600/70 bg-zinc-900/60",
    accentClass: "text-primary",
    featuredCardClass: "border-zinc-600/80 bg-zinc-900/75",
    titleClass: "text-zinc-100",
    metaClass: "text-zinc-500",
    bodyClass: "text-zinc-400",
  },
  {
    id: "grid",
    name: "Grid",
    shellClass: "from-indigo-950 via-blue-950 to-zinc-950",
    phoneClass: "bg-[#070b1a] text-slate-100",
    frameClass: "border-blue-300/25",
    chipClass: "border-blue-200/30 bg-[#0f1730]",
    cardClass: "border-blue-200/30 bg-[#0f1730]",
    accentClass: "text-cyan-300",
    featuredCardClass: "border-blue-200/35 bg-[#111a36]",
    titleClass: "text-slate-100",
    metaClass: "text-slate-400",
    bodyClass: "text-slate-300",
  },
];

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
                className="snap-start shrink-0 w-[260px] sm:w-[300px]"
              >
                <TemplateCard
                  id={tpl.id}
                  name={tpl.name}
                  shellClass={tpl.shellClass}
                  phoneClass={tpl.phoneClass}
                  frameClass={tpl.frameClass}
                  chipClass={tpl.chipClass}
                  cardClass={tpl.cardClass}
                  accentClass={tpl.accentClass}
                  featuredCardClass={tpl.featuredCardClass}
                  titleClass={tpl.titleClass}
                  metaClass={tpl.metaClass}
                  bodyClass={tpl.bodyClass}
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
  chipClass,
  cardClass,
  accentClass,
  featuredCardClass,
  titleClass,
  metaClass,
  bodyClass,
}: {
  id: string;
  name: string;
  shellClass: string;
  phoneClass: string;
  frameClass: string;
  chipClass: string;
  cardClass: string;
  accentClass: string;
  featuredCardClass: string;
  titleClass: string;
  metaClass: string;
  bodyClass: string;
}) {
  const t = useTranslations("Templates");
  const phoneT = useTranslations("Hero.preview.phone");

  return (
    <Link
      href={`/preview/templates/${id}`}
      className="group block transition-all hover:-translate-y-0.5"
    >
      <div className={`relative aspect-[3/5] overflow-hidden ${shellClass}`}>
        <div className={`h-full rounded-[1.8rem] border p-3 ${phoneClass} ${frameClass}`}>
          <div className="mx-auto mb-3 h-1 w-16 rounded-full bg-zinc-700/80" />
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-[10px] uppercase tracking-widest ${metaClass}`}>{t("menuLabel")}</p>
              <p className={`mt-1 text-2xl font-bold leading-none ${titleClass}`}>La Trattoria</p>
            </div>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${chipClass} ${titleClass}`}>
              ES
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {["category1", "category2", "category3", "category4"].map((key) => (
              <div
                key={key}
                className={`rounded-xl border px-2 py-1.5 text-center text-xs font-medium ${chipClass} ${titleClass}`}
              >
                {phoneT(key)}
              </div>
            ))}
          </div>

          {id === "grid" ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { img: "/images/dishes/bruschetta.jpg", name: "Bruschetta", price: "€7.20" },
                { img: "/images/dishes/caprese.jpg", name: "Caprese", price: "€9.80" },
                { img: "/images/dishes/risotto.jpg", name: "Risotto", price: "€16.50" },
                { img: "/images/dishes/tiramisu.jpg", name: "Tiramisù", price: "€6.50" },
              ].map((item) => (
                <article key={item.name} className={`overflow-hidden rounded-xl border p-1.5 ${cardClass}`}>
                  <Image
                    src={item.img}
                    alt={item.name}
                    width={320}
                    height={240}
                    className="aspect-[4/3] w-full rounded-md object-cover"
                    loading="lazy"
                  />
                  <p className={`mt-1 text-[11px] font-semibold ${titleClass}`}>{item.name}</p>
                  <p className={`text-[11px] font-bold ${accentClass}`}>{item.price}</p>
                </article>
              ))}
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <article className={`overflow-hidden rounded-xl border p-1.5 ${cardClass}`}>
                  <Image
                    src="/images/dishes/bruschetta.jpg"
                    alt="Bruschetta"
                    width={320}
                    height={240}
                    className="aspect-[4/3] w-full rounded-md object-cover"
                    loading="lazy"
                  />
                  <p className={`mt-1 text-xs font-semibold leading-tight ${titleClass}`}>
                    Bruschetta al pomodoro
                  </p>
                  <p className={`text-xs font-bold ${accentClass}`}>€7.20</p>
                </article>
                <article className={`overflow-hidden rounded-xl border p-1.5 ${cardClass}`}>
                  <Image
                    src="/images/dishes/caprese.jpg"
                    alt="Caprese"
                    width={320}
                    height={240}
                    className="aspect-[4/3] w-full rounded-md object-cover"
                    loading="lazy"
                  />
                  <p className={`mt-1 text-xs font-semibold leading-tight ${titleClass}`}>Caprese salad</p>
                  <p className={`text-xs font-bold ${accentClass}`}>€9.80</p>
                </article>
              </div>

              <article className={`mt-2 rounded-xl border p-2 ${featuredCardClass}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-semibold ${titleClass}`}>Tagliatelle al ragù</p>
                    <p className={`text-[11px] ${bodyClass}`}>{phoneT("dishDescription")}</p>
                  </div>
                  <span className={`text-[10px] uppercase ${metaClass}`}>{phoneT("bestSeller")}</span>
                </div>
                <p className={`mt-1 text-sm font-bold ${accentClass}`}>€14.50</p>
              </article>
            </>
          )}
        </div>
      </div>
      <div className="px-1 py-2 text-center text-sm font-semibold">
        {name}
      </div>
    </Link>
  );
}
