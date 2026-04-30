import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

const ITEM_VIEW_WEIGHT = 1;
const ITEM_CLICK_WEIGHT = 3;

export type BestSellerCandidate = {
  itemId: string;
  itemViews: number;
  itemClicks: number;
  score: number;
};

export type BestSellerLeaderboardEntry = BestSellerCandidate & {
  itemName: string;
};

export async function getBestSellerCandidates({
  resourceId,
  days = 30,
  limit = 10,
  minInteractions = 5,
  viewWeight = ITEM_VIEW_WEIGHT,
  clickWeight = ITEM_CLICK_WEIGHT,
}: {
  resourceId: string;
  days?: number;
  limit?: number;
  minInteractions?: number;
  viewWeight?: number;
  clickWeight?: number;
}): Promise<BestSellerCandidate[]> {
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const byItem = new Map<string, { views: number; clicks: number }>();
  try {
    const grouped = await db.analyticsEvent.groupBy({
      by: ["itemId", "type"],
      where: {
        resourceId,
        itemId: { not: null },
        type: { in: ["ITEM_VIEW", "ITEM_CLICK"] },
        ts: { gte: from },
      },
      _count: { _all: true },
    });

    for (const row of grouped) {
      if (!row.itemId) continue;
      const existing = byItem.get(row.itemId) ?? { views: 0, clicks: 0 };
      if (row.type === "ITEM_VIEW") existing.views += row._count._all;
      if (row.type === "ITEM_CLICK") existing.clicks += row._count._all;
      byItem.set(row.itemId, existing);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
      return [];
    }
    throw error;
  }

  return Array.from(byItem.entries())
    .map(([itemId, value]) => {
      const score = value.views * viewWeight + value.clicks * clickWeight;
      return {
        itemId,
        itemViews: value.views,
        itemClicks: value.clicks,
        score,
      };
    })
    .filter((entry) => entry.itemViews + entry.itemClicks >= minInteractions)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
}

export async function getBestSellerLeaderboard(params: {
  resourceId: string;
  days?: number;
  limit?: number;
  minInteractions?: number;
  viewWeight?: number;
  clickWeight?: number;
}): Promise<BestSellerLeaderboardEntry[]> {
  const candidates = await getBestSellerCandidates(params);
  if (!candidates.length) return [];
  const names = await db.item.findMany({
    where: {
      id: { in: candidates.map((entry) => entry.itemId) },
      category: { menu: { resourceId: params.resourceId } },
    },
    select: { id: true, name: true },
  });
  const nameById = new Map(names.map((entry) => [entry.id, entry.name]));
  return candidates.map((entry) => ({
    ...entry,
    itemName: nameById.get(entry.itemId) ?? "Unknown item",
  }));
}
