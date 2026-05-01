import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { authUrl } from "@/lib/auth/redirects";
import { appUrl, teamInviteStatus } from "@/lib/routes";
import { isTrustedRequestOrigin } from "@/lib/security/request-origin";

export async function POST(req: Request) {
  if (!isTrustedRequestOrigin(req)) {
    return NextResponse.redirect(appUrl(req.url, "team", { invite: teamInviteStatus.forbidden }));
  }
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(authUrl(req.url, "/login"));
  const ip = getClientIpFromHeaders(req.headers);
  const rl = checkRateLimit({
    key: `team-accept:${session.user.id}:${ip}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.redirect(
      appUrl(req.url, "team", { invite: teamInviteStatus.rateLimited })
    );
  }
  const sessionEmail = session.user.email?.toLowerCase();
  if (!sessionEmail) {
    return NextResponse.redirect(appUrl(req.url, "team", { invite: teamInviteStatus.invalid }));
  }

  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  if (!token) return NextResponse.redirect(appUrl(req.url, "team"));

  const invite = await db.orgInvite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return NextResponse.redirect(appUrl(req.url, "team", { invite: teamInviteStatus.invalid }));
  }
  if (invite.email.toLowerCase() !== sessionEmail) {
    return NextResponse.redirect(
      appUrl(req.url, "team", { invite: teamInviteStatus.forbidden })
    );
  }

  await db.membership.upsert({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: invite.organizationId,
      },
    },
    update: { role: invite.role },
    create: {
      userId: session.user.id,
      organizationId: invite.organizationId,
      role: invite.role,
    },
  });

  await db.orgInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  return NextResponse.redirect(appUrl(req.url, "team", { invite: teamInviteStatus.accepted }));
}
