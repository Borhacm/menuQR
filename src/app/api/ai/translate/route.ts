import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { openai } from "@/lib/ai/client";
import { appHref } from "@/lib/routes";
import { resolveTenantMembership } from "@/lib/auth/tenant";
import { getPlan } from "@/config/plans";
import { getSecondaryTranslationLocales } from "@/lib/translation/locales";
import { isTrustedRequestOrigin } from "@/lib/security/request-origin";

type TranslateProvider = "auto" | "openai" | "libretranslate" | "suffix";

const culinaryGlossary: Record<string, Record<string, string>> = {
  en: {
    "patatas fritas": "French fries",
    "papas fritas": "French fries",
    "croquetas": "Croquettes",
    "tortilla española": "Spanish omelette",
    "tortilla espanola": "Spanish omelette",
    "café con leche": "Cafe latte",
    "cafe con leche": "Cafe latte",
  },
  fr: {
    "patatas fritas": "Frites",
    "papas fritas": "Frites",
    "croquetas": "Croquettes",
    "café con leche": "Cafe au lait",
    "cafe con leche": "Cafe au lait",
  },
};

function redirectToTranslations(req: Request, status: string) {
  return NextResponse.redirect(new URL(appHref("translations", { status }), req.url));
}

function getTranslateProvider(): TranslateProvider {
  const raw = (process.env.TRANSLATE_PROVIDER ?? "auto").trim().toLowerCase();
  if (raw === "openai" || raw === "libretranslate" || raw === "suffix") return raw;
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

async function translateWithOpenAI(text: string, locale: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const completion = await openai.chat.completions.create({
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

async function translateText(text: string, locale: string) {
  if (!text.trim()) return text;
  const glossaryMatch = applyGlossary(text, locale);
  if (glossaryMatch) return glossaryMatch;
  const provider = getTranslateProvider();

  if (provider === "suffix") {
    return postNormalizeCulinaryTranslation(`${text} (${locale.toUpperCase()})`, locale);
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

  // AUTO mode: prefer OpenAI quality when available, then fallback to LibreTranslate.
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

  throw new Error("No translation provider available (LibreTranslate/OpenAI)");
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

  const value = await translateText(params.sourceText, params.locale);
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
        entityType: "RESOURCE",
        entityId: resource.id,
        locale,
        field: "name",
        sourceText: resource.name,
      });

      for (const menu of menus) {
        await upsertAiTranslation({
          entityType: "MENU",
          entityId: menu.id,
          locale,
          field: "name",
          sourceText: menu.name,
        });

        for (const category of menu.categories) {
          await upsertAiTranslation({
            entityType: "CATEGORY",
            entityId: category.id,
            locale,
            field: "name",
            sourceText: category.name,
          });

          for (const item of category.items) {
            await upsertAiTranslation({
              entityType: "ITEM",
              entityId: item.id,
              locale,
              field: "name",
              sourceText: item.name,
            });
            if (item.description) {
              await upsertAiTranslation({
                entityType: "ITEM",
                entityId: item.id,
                locale,
                field: "description",
                sourceText: item.description,
              });
            }
            for (const price of item.prices) {
              await upsertAiTranslation({
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
