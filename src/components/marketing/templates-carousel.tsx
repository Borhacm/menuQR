"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TEMPLATES = [
  {
    name: "Classic",
    palette: "from-amber-100 via-orange-100 to-rose-100",
    accent: "bg-orange-500",
  },
  {
    name: "Modern",
    palette: "from-zinc-900 via-zinc-800 to-zinc-700",
    accent: "bg-zinc-100",
    dark: true,
  },
  {
    name: "Botanical",
    palette: "from-emerald-100 via-teal-100 to-emerald-200",
    accent: "bg-emerald-600",
  },
  {
    name: "Bistro",
    palette: "from-rose-100 via-rose-200 to-amber-100",
    accent: "bg-rose-600",
  },
  {
    name: "Minimal",
    palette: "from-zinc-50 via-white to-zinc-100",
    accent: "bg-zinc-900",
  },
  {
    name: "Sea",
    palette: "from-sky-100 via-cyan-100 to-blue-100",
    accent: "bg-sky-600",
  },
  {
    name: "Sunset",
    palette: "from-orange-200 via-pink-200 to-purple-200",
    accent: "bg-pink-600",
  },
  {
    name: "Mocha",
    palette: "from-stone-200 via-stone-300 to-stone-400",
    accent: "bg-stone-800",
  },
];

export function TemplatesCarousel() {
  const t = useTranslations("Templates");
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    if (!ref.current) return;
    const w = ref.current.clientWidth;
    ref.current.scrollBy({ left: dir === "left" ? -w * 0.7 : w * 0.7, behavior: "smooth" });
  }

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

        <div className="relative mt-12">
          <div
            ref={ref}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TEMPLATES.map((tpl, i) => (
              <motion.div
                key={tpl.name}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                className="snap-start shrink-0 w-[260px] sm:w-[300px]"
              >
                <TemplateCard name={tpl.name} palette={tpl.palette} accent={tpl.accent} dark={tpl.dark} />
              </motion.div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={() => scroll("left")} aria-label="Previous">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scroll("right")} aria-label="Next">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TemplateCard({
  name,
  palette,
  accent,
  dark,
}: {
  name: string;
  palette: string;
  accent: string;
  dark?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <div
        className={`aspect-[3/5] bg-gradient-to-b ${palette} relative ${dark ? "text-white" : "text-zinc-900"}`}
      >
        <div className="absolute inset-x-0 top-0 p-5">
          <div className="text-[10px] uppercase tracking-widest opacity-70">Menu</div>
          <div className="mt-1 font-display text-2xl font-bold">{name}</div>
        </div>
        <div className="absolute inset-x-3 bottom-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-xs backdrop-blur ${
                dark ? "bg-white/10" : "bg-white/70"
              }`}
            >
              <span className="font-medium">Dish {i + 1}</span>
              <span className={`h-2 w-10 rounded-full ${accent}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border bg-card px-4 py-3 text-sm font-semibold">
        {name}
      </div>
    </div>
  );
}
