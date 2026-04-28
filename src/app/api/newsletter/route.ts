import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { email, locale } = (await req.json()) as { email?: string; locale?: string };
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  await db.newsletterSubscriber.upsert({
    where: { email: email.toLowerCase() },
    update: { locale: locale ?? "en" },
    create: { email: email.toLowerCase(), locale: locale ?? "en" },
  });

  return NextResponse.json({ ok: true });
}
