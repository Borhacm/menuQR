import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const IDENTIFIER_PREFIX = "change-email|";

function toSettingsUrl(requestUrl: string, params: Record<string, string>) {
  const url = new URL("/app/settings", requestUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

export async function GET(request: Request) {
  const requestUrl = request.url;
  const token = new URL(requestUrl).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.redirect(toSettingsUrl(requestUrl, { error: "account-email-token" }));
  }

  const record = await db.verificationToken.findUnique({
    where: { token },
  });
  if (!record) {
    return NextResponse.redirect(toSettingsUrl(requestUrl, { error: "account-email-token" }));
  }

  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token: record.token } });
    return NextResponse.redirect(toSettingsUrl(requestUrl, { error: "account-email-expired" }));
  }

  const [prefix, userId, nextEmail] = record.identifier.split("|");
  if (prefix !== "change-email" || !userId || !nextEmail) {
    await db.verificationToken.delete({ where: { token: record.token } });
    return NextResponse.redirect(toSettingsUrl(requestUrl, { error: "account-email-token" }));
  }

  const duplicate = await db.user.findFirst({
    where: { email: nextEmail, id: { not: userId } },
    select: { id: true },
  });
  if (duplicate) {
    await db.verificationToken.delete({ where: { token: record.token } });
    return NextResponse.redirect(toSettingsUrl(requestUrl, { error: "account-email-taken" }));
  }

  await db.user.update({
    where: { id: userId },
    data: {
      email: nextEmail,
      emailVerified: new Date(),
    },
  });

  await db.verificationToken.deleteMany({
    where: {
      OR: [
        { token: record.token },
        { identifier: { startsWith: `${IDENTIFIER_PREFIX}${userId}|` } },
      ],
    },
  });

  return NextResponse.redirect(toSettingsUrl(requestUrl, { saved: "account-email-confirmed" }));
}
