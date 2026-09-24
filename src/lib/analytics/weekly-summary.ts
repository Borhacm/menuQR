import { db } from "@/lib/db";
import { brand } from "@/config/brand";
import { getMenuQrBaseUrl } from "@/lib/menu-qr-public-url";

export type WeeklySummary = {
  resourceName: string;
  resourceSlug: string;
  locale: "es" | "en";
  scans: number;
  views: number;
  previousScans: number;
  topItems: { name: string; count: number }[];
  topLocales: { locale: string; count: number }[];
};

const DAY = 24 * 60 * 60 * 1000;

export async function buildWeeklySummary(resourceId: string, now = new Date()): Promise<WeeklySummary | null> {
  const resource = await db.resource.findUnique({
    where: { id: resourceId },
    select: { name: true, slug: true, defaultLocale: true },
  });
  if (!resource) return null;
  const since = new Date(now.getTime() - 7 * DAY);
  const previousSince = new Date(now.getTime() - 14 * DAY);

  const [byType, previousScans, itemCounts, localeCounts] = await Promise.all([
    db.analyticsEvent.groupBy({
      by: ["type"],
      where: { resourceId, ts: { gte: since, lt: now }, type: { in: ["SCAN", "VIEW"] } },
      _count: { _all: true },
    }),
    db.analyticsEvent.count({ where: { resourceId, type: "SCAN", ts: { gte: previousSince, lt: since } } }),
    db.analyticsEvent.groupBy({
      by: ["itemId"],
      where: { resourceId, ts: { gte: since, lt: now }, type: { in: ["ITEM_VIEW", "ITEM_CLICK"] }, itemId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { itemId: "desc" } },
      take: 5,
    }),
    db.analyticsEvent.groupBy({
      by: ["locale"],
      where: { resourceId, ts: { gte: since, lt: now }, type: "VIEW", locale: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { locale: "desc" } },
      take: 3,
    }),
  ]);

  const itemIds = itemCounts.map((row) => row.itemId).filter((id): id is string => Boolean(id));
  const items = itemIds.length
    ? await db.item.findMany({ where: { id: { in: itemIds } }, select: { id: true, name: true } })
    : [];
  const itemName = new Map(items.map((item) => [item.id, item.name]));

  return {
    resourceName: resource.name,
    resourceSlug: resource.slug,
    locale: resource.defaultLocale === "es" ? "es" : "en",
    scans: byType.find((row) => row.type === "SCAN")?._count._all ?? 0,
    views: byType.find((row) => row.type === "VIEW")?._count._all ?? 0,
    previousScans,
    topItems: itemCounts
      .filter((row) => row.itemId && itemName.has(row.itemId))
      .map((row) => ({ name: itemName.get(row.itemId!)!, count: row._count._all })),
    topLocales: localeCounts.map((row) => ({ locale: (row.locale ?? "").toUpperCase(), count: row._count._all })),
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

export function weeklySummaryEmail(summary: WeeklySummary) {
  const es = summary.locale === "es";
  const delta = summary.scans - summary.previousScans;
  const deltaText =
    summary.previousScans === 0
      ? ""
      : es
        ? ` (${delta >= 0 ? "+" : ""}${delta} respecto a la semana anterior)`
        : ` (${delta >= 0 ? "+" : ""}${delta} vs previous week)`;
  const name = escapeHtml(summary.resourceName);
  const subject = es ? `${summary.resourceName}: tu carta esta semana` : `${summary.resourceName}: your menu this week`;
  const list = (rows: { label: string; count: number }[]) =>
    rows.length
      ? `<ol style="padding-left:18px;color:#4A5163;line-height:1.7">${rows
          .map((r) => `<li>${escapeHtml(r.label)} <span style="color:#8a90a0">(${r.count})</span></li>`)
          .join("")}</ol>`
      : `<p style="color:#8a90a0">${es ? "Aún sin datos suficientes." : "Not enough data yet."}</p>`;
  const panelUrl = `${getMenuQrBaseUrl()}/app`;
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;margin:0;padding:32px;background:#F5F6F8;color:#151826">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;padding:32px">
    <p style="margin:0;color:#6B5BE2;font-weight:600;font-size:13px">${brand.name}</p>
    <h1 style="margin:6px 0 18px;font-size:20px">${es ? `Resumen semanal de ${name}` : `Weekly summary for ${name}`}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 6px"><strong>${summary.scans}</strong> ${es ? "escaneos del QR" : "QR scans"}${escapeHtml(deltaText)}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 18px"><strong>${summary.views}</strong> ${es ? "visitas a la carta" : "menu views"}</p>
    <h2 style="font-size:15px;margin:18px 0 4px">${es ? "Platos más vistos" : "Most viewed dishes"}</h2>
    ${list(summary.topItems.map((i) => ({ label: i.name, count: i.count })))}
    <h2 style="font-size:15px;margin:18px 0 4px">${es ? "Idiomas de tus clientes" : "Your guests' languages"}</h2>
    ${list(summary.topLocales.map((l) => ({ label: l.locale, count: l.count })))}
    <p><a href="${panelUrl}" style="display:inline-block;margin-top:16px;background:#151826;color:white;text-decoration:none;padding:11px 18px;border-radius:999px;font-weight:600">${es ? "Abrir el panel" : "Open the panel"}</a></p>
    <p style="color:#8a90a0;font-size:12px;margin-top:24px">${
      es
        ? "Recibes este correo porque activaste el resumen semanal en Ajustes. Puedes desactivarlo allí."
        : "You get this email because you enabled the weekly summary in Settings. You can turn it off there."
    }</p>
  </div>
</body></html>`;
  return { subject, html };
}

/** Owners/managers who opted in, with the venues of their organizations. */
export async function weeklySummaryRecipients() {
  const optedIn = await db.userSettings.findMany({
    where: { notificationsJson: { path: ["weekly"], equals: true } },
    select: {
      user: {
        select: {
          email: true,
          memberships: { select: { organization: { select: { resources: { select: { id: true } } } } } },
        },
      },
    },
  });
  return optedIn.flatMap(({ user }) =>
    user.memberships.flatMap((m) => m.organization.resources.map((r) => ({ email: user.email, resourceId: r.id })))
  );
}
