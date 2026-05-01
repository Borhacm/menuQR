import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { UAParser } from "ua-parser-js";
import { db } from "@/lib/db";
import { hashIp } from "@/lib/utils";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { isTrustedRequestOrigin } from "@/lib/security/request-origin";

const eventTypes = ["SCAN", "VIEW"] as const;
type TrackEventType = (typeof eventTypes)[number];
const itemEventTypes = ["ITEM_VIEW", "ITEM_CLICK"] as const;
type TrackItemEventType = (typeof itemEventTypes)[number];
type SupportedTrackEventType = TrackEventType | TrackItemEventType;
type TrackMetadata = Record<string, string | number | boolean | null>;

export async function POST(req: NextRequest) {
  if (!isTrustedRequestOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ip = getClientIpFromHeaders(req.headers);
  const rl = checkRateLimit({
    key: `track:${ip}`,
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many tracking requests" }, { status: 429 });
  }
  const body = (await req.json()) as {
    resourceId?: string;
    type?: string;
    itemId?: string;
    locale?: string;
    metadata?: TrackMetadata;
  };

  if (!body.resourceId || !body.type) {
    return NextResponse.json({ error: "resourceId and type are required" }, { status: 400 });
  }

  const resourceExists = await db.resource.count({ where: { id: body.resourceId } });
  if (!resourceExists) {
    return NextResponse.json({ error: "Invalid resourceId" }, { status: 400 });
  }
  const type = [...eventTypes, ...itemEventTypes].includes(body.type as SupportedTrackEventType)
    ? (body.type as SupportedTrackEventType)
    : null;
  const itemId = typeof body.itemId === "string" && body.itemId.trim().length > 0 ? body.itemId.trim() : null;
  if (itemEventTypes.includes(type as TrackItemEventType) && !itemId) {
    return NextResponse.json({ error: "itemId is required for item events" }, { status: 400 });
  }
  if (itemId) {
    const itemBelongsToResource = await db.item.count({
      where: {
        id: itemId,
        category: { menu: { resourceId: body.resourceId } },
      },
    });
    if (!itemBelongsToResource) {
      return NextResponse.json({ error: "Invalid itemId for resourceId" }, { status: 400 });
    }
  }

  if (!type) {
    return NextResponse.json({ error: "Unsupported event type" }, { status: 400 });
  }
  const ua = req.headers.get("user-agent") ?? "";
  const parser = new UAParser(ua);
  const device = parser.getDevice().type ?? parser.getOS().name ?? "unknown";
  const ipHash = hashIp(ip);

  const cookieName = `menuly_seen_${body.resourceId}`;
  const seen = req.cookies.get(cookieName)?.value === "1";

  await db.analyticsEvent.create({
    data: {
      resourceId: body.resourceId,
      itemId,
      type,
      metadataJson: body.metadata ?? Prisma.JsonNull,
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
