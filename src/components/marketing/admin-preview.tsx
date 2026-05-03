"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * First match wins (probed on client). Order: custom clip → fresh panel PNG (run capture script) → legacy PNG.
 */
const ADMIN_MEDIA_SOURCES = [
  "/images/marketing/admin-navigation.gif",
  "/images/marketing/admin-navigation.png",
  "/images/marketing/admin-navigation.webp",
  "/images/marketing/admin-panel.png",
  "/images/admin-preview/dashboard.png",
] as const;

/** Safe first paint before probe finishes (older asset; replaced when admin-panel.png exists). */
const ADMIN_MEDIA_INITIAL = "/images/admin-preview/dashboard.png";

function probeImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

function AdminPreviewArtwork() {
  return (
    <div
      className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.12),transparent_55%)]" />
      <div className="absolute inset-6 flex gap-3 sm:inset-8 sm:gap-4">
        <div className="flex w-[22%] max-w-[7.5rem] flex-col gap-2 rounded-lg border border-white/10 bg-black/35 p-2 shadow-inner sm:max-w-[9rem]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "h-2.5 rounded-md bg-white/10",
                i === 0 && "bg-primary/50 shadow-[0_0_12px_hsl(var(--primary)/0.35)]"
              )}
            />
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-3 rounded-lg border border-white/10 bg-black/25 p-3 shadow-inner animate-pulse">
          <div className="h-3 w-1/3 max-w-[10rem] rounded-md bg-white/15" />
          <div className="h-2 w-full rounded-md bg-white/[0.07]" />
          <div className="h-2 w-5/6 rounded-md bg-white/[0.06]" />
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="h-16 rounded-lg bg-white/[0.06] sm:h-20" />
            <div className="h-16 rounded-lg bg-white/[0.06] sm:h-20" />
            <div className="hidden h-16 rounded-lg bg-white/[0.06] sm:block sm:h-20" />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_hsl(0_0%_0%/0.35)]" />
    </div>
  );
}

export function AdminPreview() {
  const t = useTranslations("AdminPreview");
  const [displaySrc, setDisplaySrc] = useState<string>(ADMIN_MEDIA_INITIAL);
  const [artworkOnly, setArtworkOnly] = useState(false);
  const [pickedCustom, setPickedCustom] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < ADMIN_MEDIA_SOURCES.length; i++) {
        const url = ADMIN_MEDIA_SOURCES[i];
        if (cancelled) return;
        const ok = await probeImage(url);
        if (cancelled) return;
        if (ok) {
          setDisplaySrc(url);
          setPickedCustom(i < 3);
          return;
        }
      }
      setArtworkOnly(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t("ctaOpenPanel")}
            </Link>
            <span className="text-xs text-muted-foreground">{t("noteAuth")}</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-12 max-w-5xl"
        >
          <div className="rounded-xl border border-border/80 bg-card shadow-[0_24px_80px_-12px_hsl(0_0%_0%/0.25)] ring-1 ring-black/[0.04] dark:shadow-[0_28px_90px_-16px_hsl(0_0%_0%/0.55)] dark:ring-white/[0.07]">
            <div className="flex items-center gap-2 border-b border-border/70 bg-muted/50 px-3 py-2.5 sm:px-4">
              <span className="flex shrink-0 gap-1.5 pl-0.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </span>
              <div className="ml-2 flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border/60 bg-background/90 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm sm:text-xs">
                <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                <span className="truncate font-mono tabular-nums">app.menuly.app</span>
              </div>
            </div>

            <div className="relative overflow-hidden bg-muted/20">
              {!artworkOnly ? (
                <div className="relative mx-auto aspect-[16/10] max-h-[min(72vh,580px)] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element -- GIF + PNG; src set only after probe or safe fallback */}
                  <img
                    src={displaySrc}
                    alt={t("gifAlt")}
                    className="absolute inset-0 h-full w-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                    onError={() => setArtworkOnly(true)}
                  />
                </div>
              ) : (
                <AdminPreviewArtwork />
              )}
              {pickedCustom ? (
                <span className="pointer-events-none absolute right-3 top-3 rounded-full border border-primary/30 bg-background/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary shadow-sm backdrop-blur-sm">
                  {t("customBadge")}
                </span>
              ) : null}
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
            {t("mediaFootnote")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
