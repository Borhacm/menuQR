"use client";

import { motion } from "framer-motion";
import { ChefHat, Languages, BarChart3, QrCode, Image, Settings } from "lucide-react";

const SCREENS = [
  {
    title: "Dashboard",
    Icon: BarChart3,
    body: "scans · views · languages",
  },
  { title: "Menu editor", Icon: ChefHat, body: "drag-and-drop categories & items" },
  { title: "Translations", Icon: Languages, body: "AI + manual overrides" },
  { title: "QR builder", Icon: QrCode, body: "logo · colors · PNG/SVG/PDF" },
  { title: "Media library", Icon: Image, body: "WebP + responsive sizes" },
  { title: "Resource", Icon: Settings, body: "domain · theme · currencies" },
];

export function AdminPreview() {
  return (
    <section className="bg-muted/30 py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Screenshots
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Manage your menu in the admin panel
          </h2>
          <p className="mt-4 text-muted-foreground">
            Configure templates, create and edit products, set prices and categories
            and generate print-ready QR codes.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SCREENS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
            >
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-muted-foreground">
                  app.menuly.app
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <s.Icon className="h-4 w-4 text-primary" />
                  {s.title}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{s.body}</div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((j) => (
                    <div
                      key={j}
                      className="aspect-square rounded-md bg-gradient-to-br from-zinc-100 via-zinc-50 to-amber-100 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-950"
                    />
                  ))}
                </div>
                <div className="mt-3 h-2 w-3/4 rounded-full bg-muted" />
                <div className="mt-2 h-2 w-1/2 rounded-full bg-muted" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
