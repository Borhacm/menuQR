import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getOpenAI } from "@/lib/ai/client";
import { geminiGenerate, hasGeminiKey } from "@/lib/ai/gemini";
import { appHref } from "@/lib/routes";
import { resolveTenantMembership } from "@/lib/auth/tenant";
import { getPlan } from "@/config/plans";
import { getSecondaryTranslationLocales } from "@/lib/translation/locales";
import { isTrustedRequestOrigin } from "@/lib/security/request-origin";

type TranslateProvider = "auto" | "gemini" | "openai" | "libretranslate" | "mymemory" | "suffix";

// Exact-match terms (Spanish source) that machine translation often gets wrong, e.g. "Entrantes" -> "Incoming".
const culinaryGlossary: Record<string, Record<string, string>> = {
  en: {
    "patatas fritas": "French fries",
    "papas fritas": "French fries",
    "croquetas": "Croquettes",
    "tortilla española": "Spanish omelette",
    "tortilla espanola": "Spanish omelette",
    "café con leche": "Cafe latte",
    "cafe con leche": "Cafe latte",
    "entrantes": "Starters",
    "primeros": "First courses",
    "segundos": "Main courses",
    "principales": "Main courses",
    "platos principales": "Main courses",
    "postres": "Desserts",
    "bebidas": "Drinks",
    "raciones": "Sharing plates",
    "medias raciones": "Half portions",
    "tapas": "Tapas",
    "para compartir": "To share",
    "ensaladas": "Salads",
    "carnes": "Meat",
    "pescados": "Fish",
    "arroces": "Rice dishes",
    "menú del día": "Set menu of the day",
    "menu del dia": "Set menu of the day",
    "vinos": "Wines",
    "cervezas": "Beers",
    "cafés": "Coffees",
    "cafes": "Coffees",
    "desayunos": "Breakfast",
    "bocadillos": "Sandwiches",
  },
  fr: {
    "patatas fritas": "Frites",
    "papas fritas": "Frites",
    "croquetas": "Croquettes",
    "café con leche": "Cafe au lait",
    "cafe con leche": "Cafe au lait",
    "entrantes": "Entrées",
    "primeros": "Entrées",
    "segundos": "Plats principaux",
    "principales": "Plats principaux",
    "platos principales": "Plats principaux",
    "postres": "Desserts",
    "bebidas": "Boissons",
    "raciones": "Assiettes à partager",
    "para compartir": "À partager",
    "ensaladas": "Salades",
    "carnes": "Viandes",
    "pescados": "Poissons",
    "arroces": "Riz",
    "menú del día": "Menu du jour",
    "menu del dia": "Menu du jour",
    "vinos": "Vins",
    "cervezas": "Bières",
    "desayunos": "Petit-déjeuner",
  },
  de: {
    "entrantes": "Vorspeisen",
    "primeros": "Vorspeisen",
    "segundos": "Hauptgerichte",
    "principales": "Hauptgerichte",
    "platos principales": "Hauptgerichte",
    "postres": "Desserts",
    "bebidas": "Getränke",
    "raciones": "Zum Teilen",
    "para compartir": "Zum Teilen",
    "ensaladas": "Salate",
    "carnes": "Fleisch",
    "pescados": "Fisch",
    "arroces": "Reisgerichte",
    "menú del día": "Tagesmenü",
    "menu del dia": "Tagesmenü",
    "vinos": "Weine",
    "cervezas": "Biere",
    "desayunos": "Frühstück",
  },
  it: {
    "entrantes": "Antipasti",
    "primeros": "Primi piatti",
    "segundos": "Secondi piatti",
    "principales": "Secondi piatti",
    "platos principales": "Secondi piatti",
    "postres": "Dolci",
    "bebidas": "Bevande",
    "raciones": "Da condividere",
    "para compartir": "Da condividere",
    "ensaladas": "Insalate",
    "carnes": "Carni",
    "pescados": "Pesce",
    "arroces": "Risi",
    "menú del día": "Menù del giorno",
    "menu del dia": "Menù del giorno",
    "vinos": "Vini",
    "cervezas": "Birre",
    "desayunos": "Colazione",
  },
};

function redirectToTranslations(req: Request, status: string) {
  return NextResponse.redirect(new URL(appHref("translations", { status }), req.url));
}

function getTranslateProvider(): TranslateProvider {
  const raw = (process.env.TRANSLATE_PROVIDER ?? "auto").trim().toLowerCase();
  if (raw === "gemini" || raw === "openai" || raw === "libretranslate" || raw === "mymemory" || raw === "suffix") return raw;
  return "auto";
}

function applyGlossary(sourceText: string, locale: string): string | null {
  const lang = locale.toLowerCase().split("-")[0] ?? locale.toLowerCase();
  const dictionary = culinaryGlossary[lang];
  if (!dictionary) return null;
  return dictionary[sourceText.trim().toLowerCase()] ?? null;
}

function postNormalizeCulinaryTranslation(translatedText: string, locale: string): string {
  const lang = locale.toLowerCase().split("-")[0] ?? locale.toLowerCase();
  let result = translatedText.trim();
  if (lang === "en") {
    result = result.replace(/\bfried potatoes\b/gi, "French fries");
  }
  return result;
}

function getLocaleList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function getPrimaryLibreTranslateEndpoint(): string | null {
  return process.env.LIBRETRANSLATE_URL?.trim() || null;
}

function getSecondaryLibreTranslateEndpoint(): string | null {
  return process.env.LIBRETRANSLATE_URL_SECONDARY?.trim() || null;
}

function getSecondaryLibreTranslateLocales(): string[] {
  const configured = getLocaleList(process.env.LIBRETRANSLATE_SECONDARY_LOCALES);
  return configured.length ? configured : getSecondaryTranslationLocales();
}

const endpointRetryAfterMs = 60_000;
const endpointFailureCache = new Map<string, number>();

function resolveLibreTranslateEndpoints(locale: string): string[] {
  const normalizedLocale = locale.trim().toLowerCase();
  const primary = getPrimaryLibreTranslateEndpoint();
  const secondary = getSecondaryLibreTranslateEndpoint();
  const prefersSecondary = getSecondaryLibreTranslateLocales().includes(normalizedLocale);
  if (!primary && !secondary) return [];
  if (!secondary) return primary ? [primary] : [];
  if (!primary) return [secondary];
  return prefersSecondary ? [secondary, primary] : [primary, secondary];
}

async function translateWithLibreTranslateEndpoint(text: string, locale: string, endpoint: string) {
  const blockedUntil = endpointFailureCache.get(endpoint);
  if (blockedUntil && blockedUntil > Date.now()) {
    throw new Error(`LibreTranslate endpoint temporarily disabled: ${endpoint}`);
  }
  const source = process.env.LIBRETRANSLATE_SOURCE_LOCALE?.trim().toLowerCase() || "auto";
  const controller = new AbortController();
  const timeoutMs = Number(process.env.LIBRETRANSLATE_TIMEOUT_MS ?? "25000");
  const timer = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 8000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        q: text,
        source,
        target: locale.toLowerCase(),
        format: "text",
      }),
    });
    if (!response.ok) {
      endpointFailureCache.set(endpoint, Date.now() + endpointRetryAfterMs);
      throw new Error(`LibreTranslate request failed with status ${response.status}`);
    }
    const data = (await response.json()) as { translatedText?: string };
    endpointFailureCache.delete(endpoint);
    return data.translatedText?.trim() || text;
  } catch (error) {
    endpointFailureCache.set(endpoint, Date.now() + endpointRetryAfterMs);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function translateWithLibreTranslate(text: string, locale: string) {
  const endpoints = resolveLibreTranslateEndpoints(locale);
  if (!endpoints.length) {
    throw new Error("LIBRETRANSLATE_URL is not configured");
  }
  let lastError: unknown = null;
  for (const endpoint of endpoints) {
    try {
      return await translateWithLibreTranslateEndpoint(text, locale, endpoint);
    } catch (error) {
      lastError = error;
      console.warn(`[translate] LibreTranslate endpoint failed for ${locale}: ${endpoint}`, error);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("LibreTranslate request failed");
}

const TRANSLATOR_INSTRUCTIONS = [
  "You are a professional restaurant menu localizer.",
  "Translate from the source language into the requested target language naturally and idiomatically.",
  "Use culinary vocabulary that sounds native, concise, and appetizing.",
  "Preserve dish names/brand-like names when they are proper nouns.",
  "Do not add explanations, notes, or extra punctuation.",
  "Return only the translated text.",
].join(" ");

/**
 * MyMemory: free machine translation with no account or key (5,000 chars/day anonymous, 50,000 with
 * MYMEMORY_EMAIL). Last resort so translations work even when no provider is configured.
 */
async function translateWithMyMemory(text: string, locale: string, sourceLocale: string) {
  if (!sourceLocale || sourceLocale === locale) return text;
  const params = new URLSearchParams({ q: text.slice(0, 480), langpair: `${sourceLocale}|${locale}` });
  const email = process.env.MYMEMORY_EMAIL?.trim();
  if (email) params.set("de", email);
  const res = await fetch(`https://api.mymemory.translated.net/get?${params}`, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`MyMemory failed with status ${res.status}`);
  const data = (await res.json()) as { responseStatus?: number | string; responseData?: { translatedText?: string } };
  const out = data.responseData?.translatedText?.trim();
  if (Number(data.responseStatus) !== 200 || !out || /MYMEMORY WARNING|QUOTA/i.test(out)) {
    throw new Error(`MyMemory returned status ${data.responseStatus}`);
  }
  return out;
}

async function translateWithGemini(text: string, locale: string) {
  const out = await geminiGenerate({ system: TRANSLATOR_INSTRUCTIONS, parts: [{ text: `Translate to ${locale}: ${text}` }] });
  return out || text;
}

async function translateWithOpenAI(text: string, locale: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: [
          "You are a professional restaurant menu localizer.",
          "Translate from the source language into the requested target language naturally and idiomatically.",
          "Use culinary vocabulary that sounds native, concise, and appetizing.",
          "Preserve dish names/brand-like names when they are proper nouns.",
          "Do not add explanations, notes, or extra punctuation.",
          "Return only the translated text.",
        ].join(" "),
      },
      { role: "user", content: `Translate to ${locale}: ${text}` },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() || text;
}

async function translateText(text: string, locale: string, sourceLocale = "") {
  if (!text.trim()) return text;
  const glossaryMatch = applyGlossary(text, locale);
  if (glossaryMatch) return glossaryMatch;
  const provider = getTranslateProvider();

  if (provider === "suffix") {
    return postNormalizeCulinaryTranslation(`${text} (${locale.toUpperCase()})`, locale);
  }
  if (provider === "mymemory") {
    return postNormalizeCulinaryTranslation(await translateWithMyMemory(text, locale, sourceLocale), locale);
  }
  if (provider === "gemini") {
    try {
      return postNormalizeCulinaryTranslation(await translateWithGemini(text, locale), locale);
    } catch (geminiError) {
      console.warn("[translate] Gemini failed:", geminiError);
      throw new Error("Gemini translation failed");
    }
  }
  if (provider === "openai") {
    try {
      return postNormalizeCulinaryTranslation(await translateWithOpenAI(text, locale), locale);
    } catch (openaiError) {
      console.warn("[translate] OpenAI failed:", openaiError);
      throw new Error("OpenAI translation failed");
    }
  }
  if (provider === "libretranslate") {
    try {
      return postNormalizeCulinaryTranslation(await translateWithLibreTranslate(text, locale), locale);
    } catch (libreError) {
      console.warn("[translate] LibreTranslate failed, trying OpenAI:", libreError);
      try {
        return postNormalizeCulinaryTranslation(await translateWithOpenAI(text, locale), locale);
      } catch (openaiError) {
        console.warn("[translate] OpenAI unavailable after LibreTranslate failure:", openaiError);
        throw new Error("LibreTranslate and OpenAI translation failed");
      }
    }
  }

  // AUTO mode: Gemini (free tier) first, then OpenAI, then LibreTranslate.
  if (hasGeminiKey()) {
    try {
      return postNormalizeCulinaryTranslation(await translateWithGemini(text, locale), locale);
    } catch (geminiError) {
      console.warn("[translate] Gemini unavailable in auto mode, trying next provider:", geminiError);
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      return postNormalizeCulinaryTranslation(await translateWithOpenAI(text, locale), locale);
    } catch (openaiError) {
      console.warn("[translate] OpenAI unavailable in auto mode, trying LibreTranslate:", openaiError);
    }
  }

  try {
    return postNormalizeCulinaryTranslation(await translateWithLibreTranslate(text, locale), locale);
  } catch (libreError) {
    console.warn("[translate] LibreTranslate unavailable, trying OpenAI:", libreError);
  }

  try {
    return postNormalizeCulinaryTranslation(await translateWithOpenAI(text, locale), locale);
  } catch (openaiError) {
    console.warn("[translate] OpenAI unavailable after LibreTranslate retry:", openaiError);
  }

  try {
    return postNormalizeCulinaryTranslation(await translateWithMyMemory(text, locale, sourceLocale), locale);
  } catch (myMemoryError) {
    console.warn("[translate] MyMemory unavailable:", myMemoryError);
  }

  throw new Error("No translation provider available (Gemini/OpenAI/LibreTranslate/MyMemory)");
}

function buildSourceHash(text: string) {
  return createHash("sha256").update(text.trim()).digest("hex");
}

function isPrismaUnknownStatusFieldError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Unknown argument `status`") ||
    error.message.includes("Unknown field `status`") ||
    error.message.includes("Unknown argument `sourceHash`") ||
    error.message.includes("Unknown field `sourceHash`") ||
    error.message.includes("Unknown argument `approvedAt`") ||
    error.message.includes("Unknown field `approvedAt`")
  );
}

async function upsertAiTranslation(params: {
  entityType: "RESOURCE" | "MENU" | "CATEGORY" | "ITEM" | "ITEM_PRICE";
  entityId: string;
  locale: string;
  field: string;
  sourceText: string;
  sourceLocale?: string;
}) {
  const sourceHash = buildSourceHash(params.sourceText);
  let existing:
    | {
        status?: "DRAFT" | "APPROVED";
        sourceHash?: string | null;
        value: string;
      }
    | null = null;
  let supportsApprovalFields = true;
  try {
    existing = await db.translation.findUnique({
      where: {
        entityType_entityId_locale_field: {
          entityType: params.entityType,
          entityId: params.entityId,
          locale: params.locale,
          field: params.field,
        },
      },
      select: { status: true, sourceHash: true, value: true },
    });
  } catch (error) {
    if (!isPrismaUnknownStatusFieldError(error)) throw error;
    supportsApprovalFields = false;
    existing = await db.translation.findUnique({
      where: {
        entityType_entityId_locale_field: {
          entityType: params.entityType,
          entityId: params.entityId,
          locale: params.locale,
          field: params.field,
        },
      },
      select: { value: true },
    });
  }

  if (supportsApprovalFields) {
    if (existing?.status === "APPROVED") return;
  }

  const value = await translateText(params.sourceText, params.locale, params.sourceLocale);
  try {
    await db.translation.upsert({
      where: {
        entityType_entityId_locale_field: {
          entityType: params.entityType,
          entityId: params.entityId,
          locale: params.locale,
          field: params.field,
        },
      },
      update: {
        value,
        source: "AI",
        status: "DRAFT",
        approvedAt: null,
        sourceHash,
      },
      create: {
        entityType: params.entityType,
        entityId: params.entityId,
        locale: params.locale,
        field: params.field,
        value,
        source: "AI",
        status: "DRAFT",
        approvedAt: null,
        sourceHash,
      },
    });
  } catch (error) {
    if (!isPrismaUnknownStatusFieldError(error)) throw error;
    await db.translation.upsert({
      where: {
        entityType_entityId_locale_field: {
          entityType: params.entityType,
          entityId: params.entityId,
          locale: params.locale,
          field: params.field,
        },
      },
      update: {
        value,
        source: "AI",
      },
      create: {
        entityType: params.entityType,
        entityId: params.entityId,
        locale: params.locale,
        field: params.field,
        value,
        source: "AI",
      },
    });
  }
}

export async function POST(req: Request) {
  if (!isTrustedRequestOrigin(req)) {
    return redirectToTranslations(req, "forbidden");
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(appHref("translations"))}`, req.url));
  }

  let membership: Awaited<ReturnType<typeof resolveTenantMembership>> | null = null;
  try {
    membership = await resolveTenantMembership(session.user.id);
  } catch (error) {
    console.error("[translate] resolveTenantMembership failed:", error);
    return redirectToTranslations(req, "db_unavailable");
  }
  if (!membership) {
    return redirectToTranslations(req, "no_resource");
  }
  const resource = membership.organization.resources[0];
  if (!resource) {
    return redirectToTranslations(req, "no_resource");
  }
  const plan = getPlan(membership.organization.planId);
  const targetLocales = resource.enabledLocales
    .filter((locale) => locale !== resource.defaultLocale)
    .slice(0, plan.limits.maxLanguages);

  // Cleanup stale/previous runs so the UI does not remain stuck on RUNNING.
  await db.translationJob.updateMany({
    where: {
      resourceId: resource.id,
      status: "RUNNING",
    },
    data: {
      status: "FAILED",
      error: "Superseded by a new translation run",
      finishedAt: new Date(),
    },
  });

  const job = await db.translationJob.create({
    data: {
      resourceId: resource.id,
      payload: { kind: "resource-name", resourceName: resource.name },
      status: "RUNNING",
    },
  });

  try {
    const menus = await db.menu.findMany({
      where: { resourceId: resource.id },
      include: {
        categories: {
          include: {
            items: {
              include: {
                prices: true,
              },
            },
          },
        },
      },
    });

    for (const locale of targetLocales) {
      await upsertAiTranslation({
        sourceLocale: resource.defaultLocale,
        entityType: "RESOURCE",
        entityId: resource.id,
        locale,
        field: "name",
        sourceText: resource.name,
      });

      for (const menu of menus) {
        await upsertAiTranslation({
          sourceLocale: resource.defaultLocale,
          entityType: "MENU",
          entityId: menu.id,
          locale,
          field: "name",
          sourceText: menu.name,
        });

        for (const category of menu.categories) {
          await upsertAiTranslation({
            sourceLocale: resource.defaultLocale,
            entityType: "CATEGORY",
            entityId: category.id,
            locale,
            field: "name",
            sourceText: category.name,
          });

          for (const item of category.items) {
            await upsertAiTranslation({
              sourceLocale: resource.defaultLocale,
              entityType: "ITEM",
              entityId: item.id,
              locale,
              field: "name",
              sourceText: item.name,
            });
            if (item.description) {
              await upsertAiTranslation({
                sourceLocale: resource.defaultLocale,
                entityType: "ITEM",
                entityId: item.id,
                locale,
                field: "description",
                sourceText: item.description,
              });
            }
            for (const price of item.prices) {
              await upsertAiTranslation({
                sourceLocale: resource.defaultLocale,
                entityType: "ITEM_PRICE",
                entityId: price.id,
                locale,
                field: "label",
                sourceText: price.label ?? "Regular",
              });
            }
          }
        }
      }
    }

    await db.translationJob.update({
      where: { id: job.id },
      data: { status: "DONE", finishedAt: new Date() },
    });
  } catch (error) {
    await db.translationJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
        finishedAt: new Date(),
      },
    });
    return redirectToTranslations(req, "failed");
  }

  return redirectToTranslations(req, "done");
}
