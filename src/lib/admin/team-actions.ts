"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { appHref, appRoutes, teamInviteStatus } from "@/lib/routes";
import { inviteEmailHtml, sendEmail } from "@/lib/email";

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

