import { NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { db } from "@/lib/db";
import { hashIp } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    resourceId?: string;
    type?: "SCAN" | "VIEW";
    locale?: string;
  };

  if (!body.resourceId || !body.type) {
    return NextResponse.json({ error: "resourceId and type are required" }, { status: 400 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  const parser = new UAParser(ua);
  const device = parser.getDevice().type ?? parser.getOS().name ?? "unknown";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";
  const ipHash = hashIp(ip);

  const cookieName = `menuly_seen_${body.resourceId}`;
  const seen = req.cookies.get(cookieName)?.value === "1";

  await db.analyticsEvent.create({
    data: {
      resourceId: body.resourceId,
      type: body.type,
      locale: body.locale ?? null,
      device,
      isReturning: seen,
      ipHash,
    },
  });

  const res = NextResponse.json({ ok: true });
  if (!seen) {
    res.cookies.set(cookieName, "1", {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
  }
  return res;
}
