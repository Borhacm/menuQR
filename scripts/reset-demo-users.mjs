import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const FULL_RESET = process.argv.includes("--full");

const DEMO_USERS = [
  {
    email: "demo.free@menuly.test",
    password: "DemoFree123!",
    name: "Demo Free",
    planId: "free",
    slug: "demo-free",
  },
  {
    email: "demo.starter@menuly.test",
    password: "DemoStarter123!",
    name: "Demo Starter",
    planId: "starter",
    slug: "demo-starter",
  },
  {
    email: "demo.pro@menuly.test",
    password: "DemoPro123!",
    name: "Demo Pro",
    planId: "pro",
    slug: "demo-pro",
  },
];

async function resetDemoUser(userConfig) {
  const passwordHash = await bcrypt.hash(userConfig.password, 10);
  const orgName = `${userConfig.name} Restaurant`;

  const user = await db.user.upsert({
    where: { email: userConfig.email },
    update: {
      name: userConfig.name,
      passwordHash,
    },
    create: {
      email: userConfig.email,
      name: userConfig.name,
      passwordHash,
    },
  });

  const organization = await db.organization.upsert({
    where: { slug: userConfig.slug },
    update: {
      name: orgName,
      planId: userConfig.planId,
    },
    create: {
      name: orgName,
      slug: userConfig.slug,
      planId: userConfig.planId,
    },
  });

  if (FULL_RESET) {
    const resourceIds = (
      await db.resource.findMany({
        where: { organizationId: organization.id },
        select: { id: true },
      })
    ).map((resource) => resource.id);

    const menuIds = (
      await db.menu.findMany({
        where: { resourceId: { in: resourceIds } },
        select: { id: true },
      })
    ).map((menu) => menu.id);

    const categoryIds = (
      await db.category.findMany({
        where: { menuId: { in: menuIds } },
        select: { id: true },
      })
    ).map((category) => category.id);

    const itemIds = (
      await db.item.findMany({
        where: { categoryId: { in: categoryIds } },
        select: { id: true },
      })
    ).map((item) => item.id);

    if (itemIds.length > 0) {
      await db.itemAllergen.deleteMany({ where: { itemId: { in: itemIds } } });
      await db.itemImage.deleteMany({ where: { itemId: { in: itemIds } } });
      await db.itemPrice.deleteMany({ where: { itemId: { in: itemIds } } });
      await db.translation.deleteMany({
        where: {
          OR: [
            { entityType: "ITEM", entityId: { in: itemIds } },
            { entityType: "ITEM_PRICE", entityId: { in: itemIds } },
          ],
        },
      });
    }

    if (categoryIds.length > 0) {
      await db.translation.deleteMany({
        where: { entityType: "CATEGORY", entityId: { in: categoryIds } },
      });
    }

    if (menuIds.length > 0) {
      await db.translation.deleteMany({
        where: { entityType: "MENU", entityId: { in: menuIds } },
      });
    }

    if (resourceIds.length > 0) {
      await db.translation.deleteMany({
        where: { entityType: "RESOURCE", entityId: { in: resourceIds } },
      });
      await db.translationJob.deleteMany({ where: { resourceId: { in: resourceIds } } });
      await db.analyticsEvent.deleteMany({ where: { resourceId: { in: resourceIds } } });
      await db.qrDesign.deleteMany({ where: { resourceId: { in: resourceIds } } });
    }

    if (categoryIds.length > 0) {
      await db.item.deleteMany({ where: { categoryId: { in: categoryIds } } });
    }
    if (menuIds.length > 0) {
      await db.category.deleteMany({ where: { menuId: { in: menuIds } } });
    }
    if (resourceIds.length > 0) {
      await db.menu.deleteMany({ where: { resourceId: { in: resourceIds } } });
    }
  }

  await db.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: "OWNER",
    },
  });

  await db.subscription.upsert({
    where: { organizationId: organization.id },
    update: {
      planId: userConfig.planId,
      status: userConfig.planId === "free" ? "CANCELED" : "ACTIVE",
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
    create: {
      organizationId: organization.id,
      planId: userConfig.planId,
      status: userConfig.planId === "free" ? "CANCELED" : "ACTIVE",
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  });

  await db.resource.upsert({
    where: { slug: userConfig.slug },
    update: {
      organizationId: organization.id,
      name: orgName,
      enabledLocales: ["en", "es"],
      defaultLocale: "en",
      enabledCurrencies: ["EUR"],
      defaultCurrency: "EUR",
    },
    create: {
      organizationId: organization.id,
      slug: userConfig.slug,
      name: orgName,
      enabledLocales: ["en", "es"],
      defaultLocale: "en",
      enabledCurrencies: ["EUR"],
      defaultCurrency: "EUR",
    },
  });

  return {
    email: userConfig.email,
    planId: userConfig.planId,
    password: userConfig.password,
  };
}

async function main() {
  const results = [];
  for (const userConfig of DEMO_USERS) {
    results.push(await resetDemoUser(userConfig));
  }
  console.log(JSON.stringify({ ok: true, fullReset: FULL_RESET, users: results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
