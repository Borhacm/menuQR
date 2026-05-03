"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { appRoutes } from "@/lib/routes";
import { canUseTemplates } from "@/config/plans";

function sanitizeHexColor(value: FormDataEntryValue | null, fallback: string) {
  const raw = String(value ?? "").trim();
  return /^#([0-9a-fA-F]{6})$/.test(raw) ? raw : fallback;
}

export async function updateTemplateAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;
  const requested = String(formData.get("templateId") ?? "classic");
  const templateId = requested === "modern" || requested === "grid" ? requested : "classic";

  if (!canUseTemplates(ctx.organization.planId, 3) && templateId !== "classic") return;

  await db.resource.update({
    where: { id: ctx.resource.id },
    data: { templateId },
  });
  revalidatePath(appRoutes.items);
  revalidatePath(`/m/${ctx.resource.slug}`);
}

export async function updateTemplateStylesAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  await db.resource.update({
    where: { id: ctx.resource.id },
    data: {
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

  revalidatePath(appRoutes.items);
  revalidatePath(`/m/${ctx.resource.slug}`);
  redirect(`${appRoutes.items}?tab=style-editor&saved=styles`);
}

