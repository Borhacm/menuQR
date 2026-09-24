"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { auth, signIn } from "@/auth";
import { menuLocales } from "@/config/locales";
import { currencies } from "@/config/currencies";

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    redirect("/register?error=invalid");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) redirect("/register?error=email_taken");

  const passwordHash = await hash(password, 10);
  await db.user.create({
    data: { name, email, passwordHash },
  });

  await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  // The venue (organization + resource) is created in the onboarding wizard, where the owner picks
  // its name, menu address, source language and currency.
  redirect("/onboarding");
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

async function isSlugTaken(slug: string) {
  const [org, resource] = await Promise.all([
    db.organization.findUnique({ where: { slug }, select: { id: true } }),
    db.resource.findUnique({ where: { slug }, select: { id: true } }),
  ]);
  return Boolean(org || resource);
}

export async function completeOnboardingAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const requestedLocale = String(formData.get("defaultLocale") ?? "es").trim().toLowerCase();
  const requestedCurrency = String(formData.get("defaultCurrency") ?? "EUR").trim().toUpperCase();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  if (!name) redirect("/onboarding?error=name_required");

  const existingMembership = await db.membership.findFirst({ where: { userId } });
  if (existingMembership) {
    redirect("/app");
  }

  const defaultLocale = menuLocales.some((l) => l.code === requestedLocale) ? requestedLocale : "es";
  const defaultCurrency = currencies.some((c) => c.code === requestedCurrency) ? requestedCurrency : "EUR";
  // Source language first, plus English (or Spanish for English menus) as a ready-to-translate second language.
  const secondLocale = defaultLocale === "en" ? "es" : "en";

  const baseSlug = slugify(slugInput || name) || "restaurant";
  let orgSlug = baseSlug;
  let i = 1;
  while (await isSlugTaken(orgSlug)) {
    orgSlug = `${baseSlug}-${i++}`;
  }

  await db.organization.create({
    data: {
      name,
      slug: orgSlug,
      memberships: {
        create: {
          userId,
          role: "OWNER",
        },
      },
      resources: {
        create: {
          slug: orgSlug,
          name,
          defaultLocale,
          defaultCurrency,
          enabledLocales: [defaultLocale, secondLocale],
          enabledCurrencies: [defaultCurrency],
        },
      },
    },
  });

  redirect("/app");
}
