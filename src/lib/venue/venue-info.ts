/**
 * Venue details shown on the public menu (opening hours, WhatsApp, reviews, wifi…).
 * Stored in `Resource.socialJson.venue` so no schema migration is needed; phone and address
 * keep using the dedicated `contactPhone` / `contactAddress` columns.
 */
export type VenueInfo = {
  hours: string;
  whatsapp: string;
  reviewsUrl: string;
  instagram: string;
  wifiName: string;
  wifiPassword: string;
};

export const emptyVenueInfo: VenueInfo = {
  hours: "",
  whatsapp: "",
  reviewsUrl: "",
  instagram: "",
  wifiName: "",
  wifiPassword: "",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function str(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function readVenueInfo(socialJson: unknown): VenueInfo {
  const venue = asRecord(asRecord(socialJson).venue);
  return {
    hours: str(venue.hours, 600),
    whatsapp: str(venue.whatsapp, 32),
    reviewsUrl: str(venue.reviewsUrl, 500),
    instagram: str(venue.instagram, 100),
    wifiName: str(venue.wifiName, 64),
    wifiPassword: str(venue.wifiPassword, 64),
  };
}

/** Only http(s) links are rendered, anything else is dropped. */
export function safeHttpUrl(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** wa.me expects digits only, with country code (defaults to Spain when 9 digits are given). */
export function whatsappLink(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const withCountry = digits.length === 9 ? `34${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

export function instagramLink(value: string): string | null {
  const handle = value.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `https://instagram.com/${handle}` : null;
}

export function mergeSocialJson(socialJson: unknown, key: string, value: unknown): Record<string, unknown> {
  return { ...asRecord(socialJson), [key]: value };
}

/** Local calendar day for the venue (Spain by default), used so "sold out" resets overnight. */
export function venueTodayKey(timeZone = "Europe/Madrid", now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** `socialJson.soldOut` maps itemId -> day it was marked sold out. Only today's entries count. */
export function readSoldOutToday(socialJson: unknown, today = venueTodayKey()): Set<string> {
  const map = asRecord(asRecord(socialJson).soldOut);
  return new Set(Object.entries(map).filter(([, day]) => day === today).map(([itemId]) => itemId));
}

export function toggleSoldOutToday(socialJson: unknown, itemId: string, today = venueTodayKey()) {
  const current = asRecord(asRecord(socialJson).soldOut);
  // Drop stale days so the map never grows beyond today's entries.
  const next: Record<string, string> = {};
  for (const [id, day] of Object.entries(current)) {
    if (day === today && id !== itemId) next[id] = today;
  }
  if (current[itemId] !== today) next[itemId] = today;
  return mergeSocialJson(socialJson, "soldOut", next);
}

/**
 * Per-section options (`socialJson.sections[menuId]`): visibility by weekday/time and an optional
 * fixed price ("menú del día"). Days use ISO numbering, 1 = Monday … 7 = Sunday.
 */
export type SectionSettings = {
  days: number[];
  from: string;
  to: string;
  fixedPrice: string;
  note: string;
};

export const emptySectionSettings: SectionSettings = { days: [], from: "", to: "", fixedPrice: "", note: "" };

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function normalizeSectionSettings(raw: unknown): SectionSettings {
  const r = asRecord(raw);
  const days = Array.isArray(r.days)
    ? Array.from(new Set(r.days.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))).sort()
    : [];
  const from = typeof r.from === "string" && TIME_RE.test(r.from) ? r.from : "";
  const to = typeof r.to === "string" && TIME_RE.test(r.to) ? r.to : "";
  const price = typeof r.fixedPrice === "string" ? r.fixedPrice.replace(",", ".").trim() : "";
  const fixedPrice = /^\d{1,5}(\.\d{1,2})?$/.test(price) ? price : "";
  return { days, from, to, fixedPrice, note: str(r.note, 300) };
}

export function readSectionSettings(socialJson: unknown): Record<string, SectionSettings> {
  const sections = asRecord(asRecord(socialJson).sections);
  return Object.fromEntries(Object.entries(sections).map(([id, value]) => [id, normalizeSectionSettings(value)]));
}

function venueClock(timeZone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday")) + 1;
  return { weekday, time: `${get("hour")}:${get("minute")}` };
}

/** True when the section should be visible right now at the venue. Unscheduled sections are always open. */
export function isSectionOpen(settings: SectionSettings, timeZone = "Europe/Madrid", now = new Date()) {
  const { weekday, time } = venueClock(timeZone, now);
  if (settings.days.length && !settings.days.includes(weekday)) return false;
  if (settings.from && settings.to) {
    return settings.from <= settings.to
      ? time >= settings.from && time < settings.to
      : time >= settings.from || time < settings.to; // overnight range, e.g. 20:00-02:00
  }
  return true;
}

const DAY_SHORT = {
  es: ["L", "M", "X", "J", "V", "S", "D"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

export function describeSectionSchedule(settings: SectionSettings, locale: string): string {
  const names = locale === "es" ? DAY_SHORT.es : DAY_SHORT.en;
  const days =
    settings.days.length && settings.days.length < 7
      ? isConsecutive(settings.days)
        ? `${names[settings.days[0] - 1]}-${names[settings.days[settings.days.length - 1] - 1]}`
        : settings.days.map((d) => names[d - 1]).join(", ")
      : "";
  const hours = settings.from && settings.to ? `${settings.from}-${settings.to}` : "";
  return [days, hours].filter(Boolean).join(" · ");
}

function isConsecutive(days: number[]) {
  return days.length > 1 && days.every((d, i) => i === 0 || d === days[i - 1] + 1);
}
