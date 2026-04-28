"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { slugify } from "@/lib/utils";

export async function updateResourceAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  const name = String(formData.get("name") ?? ctx.resource.name);
  const slugInput = String(formData.get("slug") ?? ctx.resource.slug);
  const slug = slugify(slugInput) || ctx.resource.slug;
  const defaultLocale = String(formData.get("defaultLocale") ?? ctx.resource.defaultLocale);
  const defaultCurrency = String(
    formData.get("defaultCurrency") ?? ctx.resource.defaultCurrency
  );

  await db.resource.update({
    where: { id: ctx.resource.id },
    data: {
      name,
      slug,
      defaultLocale,
      defaultCurrency,
      enabledLocales: [defaultLocale, "es"],
      enabledCurrencies: [defaultCurrency, "USD"],
      themeJson: {
        primary: String(formData.get("primaryColor") ?? "#f97316"),
        background: String(formData.get("backgroundColor") ?? "#ffffff"),
      },
    },
  });

  revalidatePath("/app/resource");
}

export async function createMenuAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const count = await db.menu.count({ where: { resourceId: ctx.resource.id } });
  const menu = await db.menu.create({
    data: {
      resourceId: ctx.resource.id,
      name,
      position: count,
    },
  });

  await db.category.create({
    data: {
      menuId: menu.id,
      name: "Main",
      position: 0,
    },
  });

  revalidatePath("/app/menus");
}

export async function createItemAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  if (!name || price <= 0) return;

  let menu = await db.menu.findFirst({
    where: { resourceId: ctx.resource.id },
    include: { categories: true },
  });

  if (!menu) {
    menu = await db.menu.create({
      data: { resourceId: ctx.resource.id, name: "Main menu", position: 0 },
      include: { categories: true },
    });
  }

  let category = menu.categories[0];
  if (!category) {
    category = await db.category.create({
      data: { menuId: menu.id, name: "Main", position: 0 },
    });
  }

  const item = await db.item.create({
    data: {
      categoryId: category.id,
      name,
      description: String(formData.get("description") ?? ""),
    },
  });

  await db.itemPrice.create({
    data: {
      itemId: item.id,
      amount: price,
      currency: String(formData.get("currency") ?? "EUR"),
      label: String(formData.get("label") ?? "Regular"),
    },
  });

  revalidatePath("/app/items");
}

export async function saveQrDesignAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  const config = {
    dotsColor: String(formData.get("dotsColor") ?? "#111111"),
    bgColor: String(formData.get("bgColor") ?? "#ffffff"),
    cornerStyle: String(formData.get("cornerStyle") ?? "square"),
    logoUrl: String(formData.get("logoUrl") ?? ""),
  };

  await db.qrDesign.create({
    data: {
      resourceId: ctx.resource.id,
      name: `Design ${Date.now()}`,
      configJson: config,
    },
  });

  revalidatePath("/app/qr");
}

export async function inviteManagerAction(formData: FormData) {
  const ctx = await requireTenantContext();
  const email = String(formData.get("email") ?? "").toLowerCase();
  if (!email) return;

  const token = crypto.randomUUID().replace(/-/g, "");
  await db.orgInvite.create({
    data: {
      organizationId: ctx.organization.id,
      invitedById: ctx.user.id,
      email,
      role: "MANAGER",
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  revalidatePath("/app/team");
}
