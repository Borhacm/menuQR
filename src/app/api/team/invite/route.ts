import { NextResponse } from "next/server";
import { inviteManagerAction } from "@/lib/admin/actions";
import { auth } from "@/auth";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", req.url));
  const ip = getClientIpFromHeaders(req.headers);
  const rl = checkRateLimit({
    key: `team-invite:${session.user.id}:${ip}`,
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.redirect(new URL("/app/team?invite=rate_limited", req.url));
  }

  const form = await req.formData();
  await inviteManagerAction(form);
  return NextResponse.redirect(new URL("/app/team", req.url));
}
