"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { auth, signIn } from "@/auth";

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    throw new Error("Invalid registration payload");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already in use");

  const passwordHash = await hash(password, 10);
  const user = await db.user.create({
    data: { name, email, passwordHash },
  });

  const baseSlug = slugify(name) || "restaurant";
  let orgSlug = baseSlug;
  let i = 1;
  while (await db.organization.findUnique({ where: { slug: orgSlug } })) {
    orgSlug = `${baseSlug}-${i++}`;
  }

  const organization = await db.organization.create({
    data: {
      name: `${name} Restaurant`,
      slug: orgSlug,
      memberships: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  await db.resource.create({
    data: {
      organizationId: organization.id,
      slug: orgSlug,
      name: `${name} Restaurant`,
      enabledLocales: ["en", "es"],
      enabledCurrencies: ["EUR", "USD"],
    },
  });

  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  redirect("/app");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/app",
  });
}

export async function completeOnboardingAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const defaultLocale = String(formData.get("defaultLocale") ?? "en").trim();
  const defaultCurrency = String(formData.get("defaultCurrency") ?? "EUR").trim().toUpperCase();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const existingMembership = await db.membership.findFirst({
    where: { userId },
    include: { organization: { include: { resources: true } } },
  });
  if (existingMembership) {
    redirect("/app");
  }

  const baseSlug = slugify(slugInput || name) || "restaurant";
  let orgSlug = baseSlug;
  let i = 1;
  while (await db.organization.findUnique({ where: { slug: orgSlug } })) {
    orgSlug = `${baseSlug}-${i++}`;
  }

  const org = await db.organization.create({
    data: {
      name: name || "My Restaurant",
      slug: orgSlug,
      memberships: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
  });

  await db.resource.create({
    data: {
      organizationId: org.id,
      slug: orgSlug,
      name: name || "My Restaurant",
      defaultLocale,
      defaultCurrency,
      enabledLocales: Array.from(new Set([defaultLocale, "en", "es"])),
      enabledCurrencies: [defaultCurrency],
    },
  });

  redirect("/app");
}
