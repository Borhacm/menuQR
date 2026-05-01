import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { isTrustedRequestOrigin } from "@/lib/security/request-origin";

export async function POST(req: Request) {
  if (!isTrustedRequestOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ip = getClientIpFromHeaders(req.headers);
  const rl = checkRateLimit({
    key: `newsletter:${ip}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many newsletter requests" }, { status: 429 });
  }
  const { email, locale } = (await req.json()) as { email?: string; locale?: string };
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  await db.newsletterSubscriber.upsert({
    where: { email: normalizedEmail },
    update: { locale: locale ?? "en" },
    create: { email: normalizedEmail, locale: locale ?? "en" },
  });

  return NextResponse.json({ ok: true });
}
