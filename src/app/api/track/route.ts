import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { UAParser } from "ua-parser-js";
import { db } from "@/lib/db";
import { hashIp } from "@/lib/utils";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { isTrustedRequestOrigin } from "@/lib/security/request-origin";

const DEBUG_ENDPOINT = "http://127.0.0.1:7452/ingest/54514924-7609-4d2f-b3d9-5cf5fdd32099";
const DEBUG_SESSION_ID = "ffc295";

const eventTypes = ["SCAN", "VIEW"] as const;
type TrackEventType = (typeof eventTypes)[number];
const itemEventTypes = ["ITEM_VIEW", "ITEM_CLICK"] as const;
type TrackItemEventType = (typeof itemEventTypes)[number];
type SupportedTrackEventType = TrackEventType | TrackItemEventType;
type TrackMetadata = Record<string, string | number | boolean | null>;

export async function POST(req: NextRequest) {
  const runId = req.headers.get("x-debug-run-id") ?? "initial";

  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": DEBUG_SESSION_ID },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId,
      hypothesisId: "H2_H3",
      location: "src/app/api/track/route.ts:20",
      message: "Track request received",
      data: { hasOrigin: Boolean(req.headers.get("origin")), hasUserAgent: Boolean(req.headers.get("user-agent")) },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!isTrustedRequestOrigin(req)) {
    // #region agent log
    fetch(DEBUG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": DEBUG_SESSION_ID },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId,
        hypothesisId: "H2",
        location: "src/app/api/track/route.ts:34",
        message: "Rejected by origin guard",
        data: { reason: "untrusted-origin" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ip = getClientIpFromHeaders(req.headers);
  const rl = checkRateLimit({
    key: `track:${ip}`,
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    // #region agent log
    fetch(DEBUG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": DEBUG_SESSION_ID },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId,
        hypothesisId: "H3",
        location: "src/app/api/track/route.ts:57",
        message: "Rejected by rate limit",
        data: { ipHashPreview: hashIp(ip).slice(0, 8) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json({ error: "Too many tracking requests" }, { status: 429 });
  }
  const body = (await req.json()) as {
    resourceId?: string;
    type?: string;
    itemId?: string;
    locale?: string;
    metadata?: TrackMetadata;
  };

  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": DEBUG_SESSION_ID },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId,
      hypothesisId: "H1_H4_H5",
      location: "src/app/api/track/route.ts:78",
      message: "Track payload parsed",
      data: {
        resourceIdPresent: Boolean(body.resourceId),
        type: body.type ?? null,
        itemIdPresent: typeof body.itemId === "string" && body.itemId.trim().length > 0,
        metadataType: body.metadata === undefined ? "undefined" : body.metadata === null ? "null" : "object",
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!body.resourceId || !body.type) {
    return NextResponse.json({ error: "resourceId and type are required" }, { status: 400 });
  }

  const resourceExists = await db.resource.count({ where: { id: body.resourceId } });
  if (!resourceExists) {
    // #region agent log
    fetch(DEBUG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": DEBUG_SESSION_ID },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId,
        hypothesisId: "H1",
        location: "src/app/api/track/route.ts:88",
        message: "Rejected unknown resourceId",
        data: { resourceIdLength: body.resourceId.length },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
      // #region agent log
      fetch(DEBUG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": DEBUG_SESSION_ID },
        body: JSON.stringify({
          sessionId: DEBUG_SESSION_ID,
          runId,
          hypothesisId: "H4",
          location: "src/app/api/track/route.ts:124",
          message: "Item rejected for resource mismatch",
          data: { hasItemId: Boolean(itemId) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
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

  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": DEBUG_SESSION_ID },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId,
      hypothesisId: "H1",
      location: "src/app/api/track/route.ts:156",
      message: "Analytics event created",
      data: {
        type,
        hasMetadata: body.metadata !== undefined && body.metadata !== null,
        locale: body.locale ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
