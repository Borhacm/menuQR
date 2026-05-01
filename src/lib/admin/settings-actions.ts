"use server";

import { compare, hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hideDashboardChecklist, saveUserSettings } from "@/lib/admin/user-settings";
import { requireTenantContext } from "@/lib/auth/guards";
import { emailChangeConfirmationHtml, sendEmail } from "@/lib/email";
import { defaultResourceAnalyticsSettings } from "@/lib/analytics/settings";

function toSettingsPath(params: Record<string, string>) {
  const qs = new URLSearchParams(params);
  return `/app/settings?${qs.toString()}`;
}

async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  return userId;
}

export async function updateAccountEmailAction(formData: FormData) {
  const userId = await requireUserId();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email.includes("@")) {
    redirect(toSettingsPath({ error: "account-email" }));
  }

  const duplicate = await db.user.findFirst({
    where: { email, id: { not: userId } },
    select: { id: true },
  });
  if (duplicate) {
    redirect(toSettingsPath({ error: "account-email-taken" }));
  }

  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!currentUser) {
    redirect(toSettingsPath({ error: "account-email" }));
  }

  if (currentUser.email === email) {
    redirect(toSettingsPath({ saved: "account-email" }));
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const identifier = `change-email|${userId}|${email}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const confirmUrl = `${baseUrl}/api/account/confirm-email?token=${token}`;

  await db.verificationToken.deleteMany({
    where: { identifier: { startsWith: `change-email|${userId}|` } },
  });

  await db.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  await sendEmail({
    to: email,
    subject: "Confirm your new email",
    html: emailChangeConfirmationHtml({
      url: confirmUrl,
      nextEmail: email,
    }),
  });

  redirect(toSettingsPath({ saved: "account-email-pending" }));
}

export async function changePasswordAction(formData: FormData) {
  const userId = await requireUserId();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    redirect(toSettingsPath({ error: "password-length" }));
  }
  if (newPassword !== confirmPassword) {
    redirect(toSettingsPath({ error: "password-mismatch" }));
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    redirect(toSettingsPath({ error: "password-oauth" }));
  }

  const validCurrentPassword = await compare(currentPassword, user.passwordHash);
  if (!validCurrentPassword) {
    redirect(toSettingsPath({ error: "password-current" }));
  }

  const nextHash = await hash(newPassword, 10);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: nextHash },
  });

  redirect(toSettingsPath({ saved: "password" }));
}

export async function updateAdminPreferencesAction(formData: FormData) {
  await requireUserId();
  const locale = String(formData.get("locale") ?? "en") === "es" ? "es" : "en";

  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, { path: "/", sameSite: "lax" });

  redirect(toSettingsPath({ saved: "preferences" }));
}

export async function updateNotificationsAction(formData: FormData) {
  const userId = await requireUserId();
  const settings = {
    invites: formData.get("notifInvites") === "on",
    billing: formData.get("notifBilling") === "on",
    weekly: formData.get("notifWeekly") === "on",
  };

  await saveUserSettings(userId, {
    notifications: settings,
  });

  redirect(toSettingsPath({ saved: "notifications" }));
}

export async function closeOtherSessionsAction() {
  const userId = await requireUserId();
  await db.session.deleteMany({ where: { userId } });
  redirect(toSettingsPath({ saved: "sessions" }));
}

export async function dismissDashboardChecklistAction() {
  const userId = await requireUserId();
  await hideDashboardChecklist(userId);
  redirect("/app");
}

export async function updateResourceAnalyticsAction(formData: FormData) {
  const ctx = await requireTenantContext();
  if (!ctx.resource) {
    redirect(toSettingsPath({ error: "resource" }));
  }
  const socialJson =
    ctx.resource.socialJson && typeof ctx.resource.socialJson === "object"
      ? ({ ...(ctx.resource.socialJson as Record<string, unknown>) } as Record<string, unknown>)
      : {};
  const analytics =
    socialJson.analytics && typeof socialJson.analytics === "object"
      ? ({ ...(socialJson.analytics as Record<string, unknown>) } as Record<string, unknown>)
      : {};
  const parseIntSafe = (value: FormDataEntryValue | null, fallback: number, min: number, max: number) => {
    const parsed = Number(value ?? fallback);
    if (!Number.isFinite(parsed)) return fallback;
    const normalized = Math.floor(parsed);
    if (normalized < min) return fallback;
    return Math.min(normalized, max);
  };
  analytics.itemTrackingEnabled = formData.get("itemTrackingEnabled") === "on";
  analytics.bestSellerDays = parseIntSafe(
    formData.get("bestSellerDays"),
    defaultResourceAnalyticsSettings.bestSellerDays,
    7,
    365
  );
  analytics.bestSellerViewWeight = parseIntSafe(
    formData.get("bestSellerViewWeight"),
    defaultResourceAnalyticsSettings.bestSellerViewWeight,
    1,
    10
  );
  analytics.bestSellerClickWeight = parseIntSafe(
    formData.get("bestSellerClickWeight"),
    defaultResourceAnalyticsSettings.bestSellerClickWeight,
    1,
    10
  );
  analytics.bestSellerMinInteractions = parseIntSafe(
    formData.get("bestSellerMinInteractions"),
    defaultResourceAnalyticsSettings.bestSellerMinInteractions,
    1,
    100
  );
  socialJson.analytics = analytics;
  await db.resource.update({
    where: { id: ctx.resource.id },
    data: { socialJson: socialJson as Prisma.InputJsonValue },
  });
  redirect(toSettingsPath({ saved: "analytics" }));
}
