import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveTenantMembership } from "@/lib/auth/tenant";
import { getBestSellerLeaderboard } from "@/lib/analytics/best-seller";

function toPositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  if (normalized < 1) return fallback;
  return Math.min(normalized, max);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await resolveTenantMembership(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "No tenant membership" }, { status: 403 });
  }
  const resource = membership.organization.resources[0];
  if (!resource) {
    return NextResponse.json({ error: "No active resource" }, { status: 404 });
  }

  const searchParams = req.nextUrl.searchParams;
  const days = toPositiveInt(searchParams.get("days"), 30, 365);
  const limit = toPositiveInt(searchParams.get("limit"), 10, 50);
  const minInteractions = toPositiveInt(searchParams.get("minInteractions"), 5, 200);

  const rows = await getBestSellerLeaderboard({
    resourceId: resource.id,
    days,
    limit,
    minInteractions,
  });

  return NextResponse.json({
    ok: true,
    windowDays: days,
    limit,
    minInteractions,
    rows,
  });
}
