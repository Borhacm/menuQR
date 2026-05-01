import { NextResponse } from "next/server";
import { inviteManagerAction } from "@/lib/admin/team-actions";
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
    key: `team-invite:${session.user.id}:${ip}`,
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.redirect(
      appUrl(req.url, "team", { invite: teamInviteStatus.rateLimited })
    );
  }

  const form = await req.formData();
  await inviteManagerAction(form);
  return NextResponse.redirect(appUrl(req.url, "team"));
}
