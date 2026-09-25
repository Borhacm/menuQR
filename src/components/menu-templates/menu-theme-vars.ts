import type { CSSProperties } from "react";
import type { MenuTheme } from "@/components/menu-templates/types";

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** "h s% l%" triplet as the shadcn tokens in globals.css expect. */
function hslTriplet(hex: string, fallback: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return fallback;
  const [r, g, b] = rgb.map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function mixHex(a: string, b: string, weightA: number) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  if (!x || !y) return a;
  const mixed = x.map((v, i) => Math.round(v * weightA + y[i]! * (1 - weightA)));
  return `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function relativeLuminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
}

/** CSS variables the public menu frame and templates read (server and client safe). */
export function menuThemeVars(theme: MenuTheme): CSSProperties {
  return {
    ["--menu-bg" as string]: theme.background,
    ["--menu-surface" as string]: theme.surface,
    ["--menu-text" as string]: theme.text,
    ["--menu-border" as string]: theme.border,
    ["--menu-primary" as string]: theme.primary,
    // Secondary text is mixed from the ink itself so it keeps the theme's temperature.
    ["--menu-muted" as string]: `color-mix(in srgb, ${theme.text} 68%, ${theme.background})`,
    // shadcn tokens, so shared UI pieces inside the menu follow the venue theme too.
    ["--background" as string]: hslTriplet(theme.background, "0 0% 100%"),
    ["--foreground" as string]: hslTriplet(theme.text, "0 0% 10%"),
    ["--card" as string]: hslTriplet(theme.surface, "0 0% 100%"),
    ["--card-foreground" as string]: hslTriplet(theme.text, "0 0% 10%"),
    ["--popover" as string]: hslTriplet(theme.surface, "0 0% 100%"),
    ["--popover-foreground" as string]: hslTriplet(theme.text, "0 0% 10%"),
    ["--muted" as string]: hslTriplet(mixHex(theme.text, theme.background, 0.08), "0 0% 95%"),
    ["--muted-foreground" as string]: hslTriplet(mixHex(theme.text, theme.background, 0.68), "0 0% 40%"),
    ["--secondary" as string]: hslTriplet(mixHex(theme.text, theme.background, 0.08), "0 0% 95%"),
    ["--secondary-foreground" as string]: hslTriplet(theme.text, "0 0% 10%"),
    ["--accent" as string]: hslTriplet(mixHex(theme.primary, theme.background, 0.14), "0 0% 95%"),
    ["--accent-foreground" as string]: hslTriplet(theme.text, "0 0% 10%"),
    ["--border" as string]: hslTriplet(theme.border, "0 0% 88%"),
    ["--input" as string]: hslTriplet(theme.border, "0 0% 88%"),
    ["--ring" as string]: hslTriplet(theme.primary, "0 0% 20%"),
    ["--primary" as string]: hslTriplet(theme.primary, "0 0% 10%"),
    ["--primary-foreground" as string]: relativeLuminance(theme.primary) > 0.4 ? "0 0% 7%" : "0 0% 100%",
    colorScheme: relativeLuminance(theme.background) > 0.4 ? "light" : "dark",
    backgroundColor: theme.background,
    color: theme.text,
    fontFamily: theme.fontFamily || undefined,
  } as CSSProperties;
}
