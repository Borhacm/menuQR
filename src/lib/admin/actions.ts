"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { slugify } from "@/lib/utils";
import { appRoutes } from "@/lib/routes";
import { appHref, teamInviteStatus } from "@/lib/routes";
import {
  canUseCustomDomain,
  canUseMultiCurrency,
  canUseQrBranding,
  canUseTemplates,
  hasAllergenFeature,
} from "@/config/plans";
import { inviteEmailHtml, sendEmail } from "@/lib/email";
import { isTranslationLocaleConfigured } from "@/lib/translation/locales";

function sanitizeHexColor(value: FormDataEntryValue | null, fallback: string) {
  const raw = String(value ?? "").trim();
  return /^#([0-9a-fA-F]{6})$/.test(raw) ? raw : fallback;
}

function parsePriceValue(value: FormDataEntryValue): number {
  const raw = String(value ?? "").trim();
  if (!raw) return NaN;
  // Accept both decimal separators to avoid locale-specific form failures.
  const normalized = raw.replace(",", ".");
  return Number(normalized);
}

function normalizeSourceHash(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^[a-f0-9]{64}$/i.test(raw)) return raw.toLowerCase();
  return createHash("sha256").update(raw).digest("hex");
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

export async function createMenuAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const count = await db.menu.count({ where: { resourceId: ctx.resource.id } });
  await db.menu.create({
    data: {
      resourceId: ctx.resource.id,
      name,
      position: count,
    },
  });

  revalidatePath(appRoutes.menus);
}

export async function updateMenuAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;
  const menuId = String(formData.get("menuId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!menuId || !name) return;

  const owned = await db.menu.findFirst({
    where: { id: menuId, resourceId: ctx.resource.id },
    select: { id: true },
  });
  if (!owned) return;

  await db.menu.update({
    where: { id: owned.id },
    data: { name },
  });
  revalidatePath(appRoutes.menus);
}

export async function moveMenuAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  const menuId = String(formData.get("menuId") ?? "").trim();
  const direction = String(formData.get("direction") ?? "").trim();
  if (!menuId || (direction !== "up" && direction !== "down")) return;

  const menus = await db.menu.findMany({
    where: { resourceId: ctx.resource.id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const currentIndex = menus.findIndex((menu) => menu.id === menuId);
  if (currentIndex < 0) return;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= menus.length) return;

  const ordered = [...menus];
  const [current] = ordered.splice(currentIndex, 1);
  if (!current) return;
  ordered.splice(targetIndex, 0, current);

  await db.$transaction(
    ordered.map((menu, index) =>
      db.menu.update({
        where: { id: menu.id },
        data: { position: index },
      })
    )
  );

  revalidatePath(appRoutes.menus);
  revalidatePath(appRoutes.items);
}

export async function deleteMenuAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;
  const successPath = appHref("items", { tab: "categories", deleted: Date.now() });
  const menuId = String(formData.get("menuId") ?? "").trim();
  if (!menuId) redirect(successPath);

  const owned = await db.menu.findFirst({
    where: { id: menuId, resourceId: ctx.resource.id },
    select: { id: true },
  });
  if (!owned) redirect(successPath);

  await db.menu.delete({
    where: { id: owned.id },
  });
  revalidatePath(appRoutes.menus);
  revalidatePath(appRoutes.items);
  redirect(successPath);
}

export async function createCategoryAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const requestedMenuId = String(formData.get("menuId") ?? "").trim();
  let menu = requestedMenuId
    ? await db.menu.findFirst({
        where: { id: requestedMenuId, resourceId: ctx.resource.id },
        select: { id: true },
      })
    : null;

  if (!menu) {
    menu = await db.menu.findFirst({
      where: { resourceId: ctx.resource.id },
      orderBy: { position: "asc" },
      select: { id: true },
    });
  }

  if (!menu) {
    menu = await db.menu.create({
      data: {
        resourceId: ctx.resource.id,
        name: ctx.resource.name || "Menu",
        position: 0,
      },
      select: { id: true },
    });
  }

  const count = await db.category.count({ where: { menuId: menu.id } });
  await db.category.create({
    data: {
      menuId: menu.id,
      name,
      position: count,
    },
  });

  revalidatePath(appRoutes.items);
  revalidatePath(appRoutes.menus);
}

export async function updateCategoryAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!categoryId || !name) return;

  const owned = await db.category.findFirst({
    where: { id: categoryId, menu: { resourceId: ctx.resource.id } },
    select: { id: true },
  });
  if (!owned) return;

  await db.category.update({
    where: { id: owned.id },
    data: { name },
  });

  revalidatePath(appRoutes.items);
  revalidatePath(appRoutes.menus);
}

export async function deleteCategoryAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  const categoryId = String(formData.get("categoryId") ?? "").trim();
  if (!categoryId) return;

  const owned = await db.category.findFirst({
    where: { id: categoryId, menu: { resourceId: ctx.resource.id } },
    select: { id: true },
  });
  if (!owned) return;

  await db.category.delete({
    where: { id: owned.id },
  });

  revalidatePath(appRoutes.items);
  revalidatePath(appRoutes.menus);
}

export async function createItemAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;
  const successPath = appHref("items", { tab: "products", created: Date.now() });

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const priceValues = formData.getAll("priceValues").map(parsePriceValue);
  const currencyValues = formData.getAll("currencyValues").map((v) => String(v || "EUR").toUpperCase());
  const prices = priceValues
    .map((amount, idx) => ({
      amount,
      currency: currencyValues[idx] ?? "EUR",
    }))
    .filter((entry) => entry.amount > 0);
  if (!prices.length) return;
  const normalizedPrices = canUseMultiCurrency(ctx.organization.planId) ? prices : [prices[0]!];

  const requestedCategoryId = String(formData.get("categoryId") ?? "").trim();
  let category = requestedCategoryId
    ? await db.category.findFirst({
        where: { id: requestedCategoryId, menu: { resourceId: ctx.resource.id } },
      })
    : null;

  if (!category) {
    let menu = await db.menu.findFirst({
      where: { resourceId: ctx.resource.id },
      include: { categories: true },
    });

    if (!menu) {
      menu = await db.menu.create({
        data: { resourceId: ctx.resource.id, name: ctx.resource.name || "Menu", position: 0 },
        include: { categories: true },
      });
    }

    category = menu.categories[0] ?? null;
    if (!category) {
      category = await db.category.create({
        data: { menuId: menu.id, name: menu.name, position: 0 },
      });
    }
  }

  const description = String(formData.get("description") ?? "").trim();
  const item = await db.item.create({
    data: {
      categoryId: category.id,
      name,
      description,
      isFeatured: String(formData.get("isFeatured") ?? "") === "on",
      isVegan: String(formData.get("isVegan") ?? "") === "on",
      isVegetarian: String(formData.get("isVegetarian") ?? "") === "on",
      isGlutenFree: String(formData.get("isGlutenFree") ?? "") === "on",
      isSpicy: String(formData.get("isSpicy") ?? "") === "on",
    },
  });

  await db.itemPrice.createMany({
    data: normalizedPrices.map((entry, idx) => ({
      itemId: item.id,
      amount: entry.amount,
      currency: entry.currency,
      label: "Default",
      position: idx,
    })),
  });

  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim();
  if (imageUrl) {
    await db.itemImage.create({
      data: {
        itemId: item.id,
        url: imageUrl,
        alt: imageAlt || `Foto del plato ${name}`,
        position: 0,
      },
    });
  }

  if (hasAllergenFeature(ctx.organization.planId)) {
    const allergenCodes = formData
      .getAll("allergens")
      .map((value) => String(value))
      .filter(Boolean);

    if (allergenCodes.length) {
      const allergens = await db.allergen.findMany({
        where: { code: { in: allergenCodes } },
        select: { id: true },
      });

      if (allergens.length) {
        await db.itemAllergen.createMany({
          data: allergens.map((allergen) => ({
            itemId: item.id,
            allergenId: allergen.id,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  revalidatePath(appRoutes.items);
  redirect(successPath);
}

export async function updateItemAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;
  const successPath = appHref("items", { tab: "products", updated: Date.now() });
  const errorPath = appHref("items", { tab: "products", updateError: Date.now() });

  const itemId = String(formData.get("itemId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const isFeatured = String(formData.get("isFeatured") ?? "") === "on";
  const priceValues = formData.getAll("priceValues").map(parsePriceValue);
  const currencyValues = formData.getAll("currencyValues").map((v) => String(v || "EUR").toUpperCase());
  const normalizedPrices = priceValues
    .map((amount, idx) => ({
      amount,
      currency: currencyValues[idx] ?? "EUR",
    }))
    .filter((entry) => entry.amount > 0);
  const allowedPrices = canUseMultiCurrency(ctx.organization.planId)
    ? normalizedPrices
    : normalizedPrices.slice(0, 1);
  if (!itemId || !name) return;

  const ownedItem = await db.item.findFirst({
    where: { id: itemId, category: { menu: { resourceId: ctx.resource.id } } },
    select: { id: true },
  });
  if (!ownedItem) return;

  const ownedCategory = categoryId
    ? await db.category.findFirst({
        where: { id: categoryId, menu: { resourceId: ctx.resource.id } },
        select: { id: true },
      })
    : null;

  try {
    await db.$transaction(async (tx) => {
      await tx.item.update({
        where: { id: ownedItem.id },
        data: {
          name,
          description,
          categoryId: ownedCategory?.id,
          isFeatured,
        },
      });

      if (allowedPrices.length) {
        await tx.itemPrice.deleteMany({
          where: { itemId: ownedItem.id },
        });
        await tx.itemPrice.createMany({
          data: allowedPrices.map((entry, idx) => ({
            itemId: ownedItem.id,
            amount: entry.amount,
            currency: entry.currency,
            label: "Default",
            position: idx,
          })),
        });
      }

      if (hasAllergenFeature(ctx.organization.planId)) {
        const allergenCodes = formData
          .getAll("allergens")
          .map((value) => String(value))
          .filter(Boolean);
        const allergens = allergenCodes.length
          ? await tx.allergen.findMany({
              where: { code: { in: allergenCodes } },
              select: { id: true },
            })
          : [];

        await tx.itemAllergen.deleteMany({
          where: { itemId: ownedItem.id },
        });
        if (allergens.length) {
          await tx.itemAllergen.createMany({
            data: allergens.map((allergen) => ({
              itemId: ownedItem.id,
              allergenId: allergen.id,
            })),
            skipDuplicates: true,
          });
        }
      }
    });
  } catch (error) {
    console.error("[updateItemAction] failed:", error);
    redirect(errorPath);
  }
  revalidatePath(appRoutes.items);
  redirect(successPath);
}

export async function deleteItemAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;
  const successPath = appHref("items", { tab: "products", deleted: Date.now() });

  const itemId = String(formData.get("itemId") ?? "").trim();
  if (!itemId) redirect(successPath);

  const ownedItem = await db.item.findFirst({
    where: { id: itemId, category: { menu: { resourceId: ctx.resource.id } } },
    select: { id: true },
  });
  if (!ownedItem) redirect(successPath);

  await db.item.delete({ where: { id: ownedItem.id } });
  revalidatePath(appRoutes.items);
  redirect(successPath);
}

export async function saveQrDesignAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;
  if (!canUseQrBranding(ctx.organization.planId)) return;
  const designId = String(formData.get("designId") ?? "").trim();
  const saveMode = String(formData.get("saveMode") ?? "update").trim();

  const config = {
    dotsColor: String(formData.get("dotsColor") ?? "#111111"),
    bgColor: String(formData.get("bgColor") ?? "#ffffff"),
    dotStyle: String(formData.get("dotStyle") ?? "square"),
    cornerStyle: String(formData.get("cornerStyle") ?? "square"),
    logoUrl: String(formData.get("logoUrl") ?? ""),
    logoColor: String(formData.get("logoColor") ?? "#111111"),
  };

  if (saveMode === "create") {
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

export async function inviteManagerAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (ctx.membership.role !== "OWNER") {
    redirect(appHref("team", { invite: teamInviteStatus.forbidden }));
  }
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const existingMember = await db.membership.findFirst({
    where: {
      organizationId: ctx.organization.id,
      user: { email },
    },
    select: { id: true },
  });
  if (existingMember) {
    redirect(appHref("team", { invite: teamInviteStatus.alreadyMember }));
  }

  const existingPendingInvite = await db.orgInvite.findFirst({
    where: {
      organizationId: ctx.organization.id,
      email,
      acceptedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  const token = crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const inviteUrl = `${appBaseUrl}/invite/${token}`;

  if (existingPendingInvite) {
    await db.orgInvite.update({
      where: { id: existingPendingInvite.id },
      data: { token, expiresAt },
    });
    await sendEmail({
      to: email,
      subject: `Invitation to join ${ctx.organization.name}`,
      html: inviteEmailHtml({
        orgName: ctx.organization.name,
        inviterName: ctx.user.name ?? ctx.user.email ?? "A teammate",
        url: inviteUrl,
      }),
    });
    revalidatePath(appRoutes.team);
    redirect(appHref("team", { invite: teamInviteStatus.alreadyPending }));
  }

  await db.orgInvite.create({
    data: {
      organizationId: ctx.organization.id,
      invitedById: ctx.user.id,
      email,
      role: "MANAGER",
      token,
      expiresAt,
    },
  });
  await sendEmail({
    to: email,
    subject: `Invitation to join ${ctx.organization.name}`,
    html: inviteEmailHtml({
      orgName: ctx.organization.name,
      inviterName: ctx.user.name ?? ctx.user.email ?? "A teammate",
      url: inviteUrl,
    }),
  });

  revalidatePath(appRoutes.team);
  redirect(appHref("team", { invite: teamInviteStatus.invited }));
}

export async function updateMemberRoleAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (ctx.membership.role !== "OWNER") return;

  const memberId = String(formData.get("memberId") ?? "").trim();
  const nextRole = String(formData.get("role") ?? "").trim();
  if (!memberId || (nextRole !== "OWNER" && nextRole !== "MANAGER")) return;

  const target = await db.membership.findFirst({
    where: { id: memberId, organizationId: ctx.organization.id },
    select: { id: true, role: true, userId: true },
  });
  if (!target) return;

  // Prevent removing owner rights from the last owner in the organization.
  if (target.role === "OWNER" && nextRole !== "OWNER") {
    const owners = await db.membership.count({
      where: { organizationId: ctx.organization.id, role: "OWNER" },
    });
    if (owners <= 1) return;
  }

  await db.membership.update({
    where: { id: target.id },
    data: { role: nextRole },
  });

  revalidatePath(appRoutes.team);
}

export async function removeMemberAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (ctx.membership.role !== "OWNER") return;

  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!memberId) return;

  const target = await db.membership.findFirst({
    where: { id: memberId, organizationId: ctx.organization.id },
    select: { id: true, role: true, userId: true },
  });
  if (!target) return;
  if (target.userId === ctx.user.id) return;

  if (target.role === "OWNER") {
    const owners = await db.membership.count({
      where: { organizationId: ctx.organization.id, role: "OWNER" },
    });
    if (owners <= 1) return;
  }

  await db.membership.delete({ where: { id: target.id } });
  revalidatePath(appRoutes.team);
}

export async function resendInviteAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (ctx.membership.role !== "OWNER") return;

  const inviteId = String(formData.get("inviteId") ?? "").trim();
  if (!inviteId) return;

  const invite = await db.orgInvite.findFirst({
    where: {
      id: inviteId,
      organizationId: ctx.organization.id,
      acceptedAt: null,
    },
    select: {
      id: true,
      email: true,
      token: true,
    },
  });
  if (!invite) return;

  const token = crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appBaseUrl}/invite/${token}`;

  await db.orgInvite.update({
    where: { id: invite.id },
    data: { token, expiresAt },
  });

  await sendEmail({
    to: invite.email,
    subject: `Invitation to join ${ctx.organization.name}`,
    html: inviteEmailHtml({
      orgName: ctx.organization.name,
      inviterName: ctx.user.name ?? ctx.user.email ?? "A teammate",
      url: inviteUrl,
    }),
  });

  revalidatePath(appRoutes.team);
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
  revalidatePath(appRoutes.templates);
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

  revalidatePath(appRoutes.templates);
  revalidatePath(`/m/${ctx.resource.slug}`);
  redirect(`${appRoutes.templates}?saved=styles`);
}

export async function saveTranslationOverrideAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  const entityTypeRaw = String(formData.get("entityType") ?? "");
  const entityType =
    entityTypeRaw === "RESOURCE" ||
    entityTypeRaw === "MENU" ||
    entityTypeRaw === "CATEGORY" ||
    entityTypeRaw === "ITEM" ||
    entityTypeRaw === "ITEM_PRICE"
      ? entityTypeRaw
      : null;
  const entityId = String(formData.get("entityId") ?? "");
  const locale = String(formData.get("locale") ?? "").trim().toLowerCase();
  const field = String(formData.get("field") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  const approveOnly = String(formData.get("approve") ?? "") === "1";
  const sourceHash = normalizeSourceHash(formData.get("sourceHash"));
  if (!entityType || !entityId || !locale || !field || !value) return;

  const existing = await db.translation.findUnique({
    where: {
      entityType_entityId_locale_field: {
        entityType,
        entityId,
        locale,
        field,
      },
    },
    select: { source: true },
  });
  const nextSource = approveOnly ? (existing?.source ?? "AI") : "MANUAL";

  try {
    await db.translation.upsert({
      where: {
        entityType_entityId_locale_field: {
          entityType,
          entityId,
          locale,
          field,
        },
      },
      update: {
        value,
        source: nextSource,
        status: "APPROVED",
        approvedAt: new Date(),
        sourceHash,
      },
      create: {
        entityType,
        entityId,
        locale,
        field,
        value,
        source: nextSource,
        status: "APPROVED",
        approvedAt: new Date(),
        sourceHash,
      },
    });
  } catch (error) {
    if (!isPrismaUnknownStatusFieldError(error)) throw error;
    await db.translation.upsert({
      where: {
        entityType_entityId_locale_field: {
          entityType,
          entityId,
          locale,
          field,
        },
      },
      update: {
        value,
        source: nextSource,
      },
      create: {
        entityType,
        entityId,
        locale,
        field,
        value,
        source: nextSource,
      },
    });
  }

  revalidatePath(appRoutes.translations);
}

export async function markTranslationDraftAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) return;

  const entityTypeRaw = String(formData.get("entityType") ?? "");
  const entityType =
    entityTypeRaw === "RESOURCE" ||
    entityTypeRaw === "MENU" ||
    entityTypeRaw === "CATEGORY" ||
    entityTypeRaw === "ITEM" ||
    entityTypeRaw === "ITEM_PRICE"
      ? entityTypeRaw
      : null;
  const entityId = String(formData.get("entityId") ?? "");
  const locale = String(formData.get("locale") ?? "").trim().toLowerCase();
  const field = String(formData.get("field") ?? "").trim();
  if (!entityType || !entityId || !locale || !field) return;

  try {
    await db.translation.update({
      where: {
        entityType_entityId_locale_field: {
          entityType,
          entityId,
          locale,
          field,
        },
      },
      data: {
        status: "DRAFT",
        approvedAt: null,
      },
    });
  } catch (error) {
    // Legacy runtime or missing row: keep going without breaking UX.
    if (!isPrismaUnknownStatusFieldError(error)) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")) {
        throw error;
      }
    }
  }

  revalidatePath(appRoutes.translations);
}
