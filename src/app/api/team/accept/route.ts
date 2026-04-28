import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", req.url));
  const ip = getClientIpFromHeaders(req.headers);
  const rl = checkRateLimit({
    key: `team-accept:${session.user.id}:${ip}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.redirect(new URL("/app/team?invite=rate_limited", req.url));
  }
  const sessionEmail = session.user.email?.toLowerCase();
  if (!sessionEmail) {
    return NextResponse.redirect(new URL("/app/team?invite=invalid", req.url));
  }

  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  if (!token) return NextResponse.redirect(new URL("/app/team", req.url));

  const invite = await db.orgInvite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/app/team?invite=invalid", req.url));
  }
  if (invite.email.toLowerCase() !== sessionEmail) {
    return NextResponse.redirect(new URL("/app/team?invite=forbidden", req.url));
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

  return NextResponse.redirect(new URL("/app/team?invite=accepted", req.url));
}
