"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { appRoutes } from "@/lib/routes";
import { canUseQrBranding } from "@/config/plans";

export async function saveQrDesignAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  const designId = String(formData.get("designId") ?? "").trim();
  const dotsColor = String(formData.get("dotsColor") ?? "").trim();
  const bgColor = String(formData.get("bgColor") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const logoColor = String(formData.get("logoColor") ?? "").trim();
  const dotStyle = String(formData.get("dotStyle") ?? "square").trim();
  const cornerStyle = String(formData.get("cornerStyle") ?? "square").trim();

  const canBrand = canUseQrBranding(ctx.organization.planId);
  const config = canBrand
    ? { dotsColor, bgColor, logoUrl, logoColor, dotStyle, cornerStyle }
    : { dotsColor, bgColor };
  const shouldCreateNew =
    String(formData.get("createNew") ?? "").trim().toLowerCase() === "1" ||
    String(formData.get("createNew") ?? "").trim().toLowerCase() === "true";

  if (shouldCreateNew) {
    await db.qrDesign.create({
      data: {
        resourceId: ctx.resource.id,
        name: `Design ${Date.now()}`,
        configJson: config,
      },
    });
  } else if (designId) {
    const existing = await db.qrDesign.findFirst({
      where: { id: designId, resourceId: ctx.resource.id },
      select: { id: true },
    });
    if (existing) {
      await db.qrDesign.update({
        where: { id: existing.id },
        data: { configJson: config },
      });
    } else {
      await db.qrDesign.create({
        data: {
          resourceId: ctx.resource.id,
          name: `Design ${Date.now()}`,
          configJson: config,
        },
      });
    }
  } else {
    await db.qrDesign.create({
      data: {
        resourceId: ctx.resource.id,
        name: `Design ${Date.now()}`,
        configJson: config,
      },
    });
  }

  revalidatePath(appRoutes.qr);
}

export async function renameQrDesignAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  const designId = String(formData.get("designId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!designId || !name) return;

  const design = await db.qrDesign.findFirst({
    where: { id: designId, resourceId: ctx.resource.id },
    select: { id: true },
  });
  if (!design) return;

  await db.qrDesign.update({
    where: { id: design.id },
    data: { name },
  });
  revalidatePath(appRoutes.qr);
}

export async function deleteQrDesignAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  const designId = String(formData.get("designId") ?? "").trim();
  if (!designId) return;

  const design = await db.qrDesign.findFirst({
    where: { id: designId, resourceId: ctx.resource.id },
    select: { id: true },
  });
  if (!design) return;

  await db.qrDesign.delete({
    where: { id: design.id },
  });
  revalidatePath(appRoutes.qr);
}

