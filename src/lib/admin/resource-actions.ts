"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { slugify } from "@/lib/utils";
import { appHref, appRoutes } from "@/lib/routes";
import { canUseCustomDomain, canUseMultiCurrency } from "@/config/plans";
import { isTranslationLocaleConfigured } from "@/lib/translation/locales";

function sanitizeHexColor(value: FormDataEntryValue | null, fallback: string) {
  const raw = String(value ?? "").trim();
  return /^#([0-9a-fA-F]{6})$/.test(raw) ? raw : fallback;
}

export async function updateResourceAction(formData: FormData) {
  const ctx = await requireTenantContext();
  const successPath = appHref("settings", { saved: "resource" });
  const errorPath = appHref("settings", { error: "resource" });
  const errorSlugPath = appHref("settings", { error: "resource-slug" });
  const errorLocalesPath = appHref("settings", { error: "resource-locales" });
  if (!ctx.resource) {
    redirect(errorPath);
  }

  const name = String(formData.get("name") ?? ctx.resource.name);
  const slugInput = String(formData.get("slug") ?? ctx.resource.slug);
  const slug = slugify(slugInput) || ctx.resource.slug;
  const defaultLocale = String(formData.get("defaultLocale") ?? ctx.resource.defaultLocale);
  const defaultCurrency = String(
    formData.get("defaultCurrency") ?? ctx.resource.defaultCurrency
  );
  const requestedLocales = formData
    .getAll("enabledLocales")
    .map((entry) => String(entry).trim().toLowerCase())
    .filter(Boolean);
  const hasUnsupportedLocale = requestedLocales.some((localeCode) => !isTranslationLocaleConfigured(localeCode));
  if (hasUnsupportedLocale) {
    redirect(errorLocalesPath);
  }
  const requestedCurrencies = formData
    .getAll("enabledCurrencies")
    .map((entry) => String(entry).trim().toUpperCase())
    .filter(Boolean);
  const planId = ctx.organization.planId;
  const canUseMoreCurrencies = canUseMultiCurrency(planId);
  const enabledLocales = Array.from(
    new Set([defaultLocale, "es", ...(requestedLocales.length ? requestedLocales : [])])
  );
  const enabledCurrencies = canUseMoreCurrencies
    ? Array.from(
        new Set([defaultCurrency, "USD", ...(requestedCurrencies.length ? requestedCurrencies : [])])
      )
    : [defaultCurrency];
  const hasCustomDomainField = formData.has("customDomain");
  const customDomain = String(formData.get("customDomain") ?? "").trim().toLowerCase();
  const hasRootDomainField = formData.has("rootDomain");
  const rootDomain = String(formData.get("rootDomain") ?? "").trim().toLowerCase();
  const currentSocialJson =
    ctx.resource.socialJson && typeof ctx.resource.socialJson === "object"
      ? (ctx.resource.socialJson as Record<string, unknown>)
      : {};

  try {
    await db.resource.update({
      where: { id: ctx.resource.id },
      data: {
        name,
        slug,
        defaultLocale,
        defaultCurrency,
        enabledLocales,
        enabledCurrencies,
        description:
          canUseCustomDomain(planId) && hasCustomDomainField
            ? customDomain
              ? `custom-domain:${customDomain}`
              : null
            : ctx.resource.description,
        socialJson: hasRootDomainField
          ? {
              ...currentSocialJson,
              rootDomain,
            }
          : (ctx.resource.socialJson as Prisma.InputJsonValue | undefined),
        themeJson: {
          primary: sanitizeHexColor(formData.get("primaryColor"), "#ffd400"),
          background: sanitizeHexColor(formData.get("backgroundColor"), "#0d0d0d"),
          surface: sanitizeHexColor(formData.get("surfaceColor"), "#1a1a1a"),
          text: sanitizeHexColor(formData.get("textColor"), "#f5f5f5"),
          border: sanitizeHexColor(formData.get("borderColor"), "#333333"),
          fontFamily: String(formData.get("fontFamily") ?? "Inter").trim() || "Inter",
          density: String(formData.get("density") ?? "comfortable").trim() || "comfortable",
        },
      },
    });
    try {
      await db.organization.update({
        where: { id: ctx.organization.id },
        data: { name },
      });
    } catch (orgError) {
      console.error("[updateResourceAction] organization update skipped:", orgError);
    }
  } catch (error) {
    console.error("[updateResourceAction] failed:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(errorSlugPath);
    }
    redirect(errorPath);
  }

  revalidatePath(appRoutes.settings);
  redirect(successPath);
}

