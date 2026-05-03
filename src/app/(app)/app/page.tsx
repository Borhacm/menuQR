import { requireTenantContext } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { appHref, appRoutes } from "@/lib/routes";
import Link from "next/link";
import { getAdminLocale, getAdminMessages } from "@/lib/admin/i18n";
import { canUseAdvancedAnalytics, canUseAnalyticsCharts } from "@/config/plans";
import { dismissDashboardChecklistAction } from "@/lib/admin/settings-actions";
import { getDashboardChecklistHidden } from "@/lib/admin/user-settings";
import { Button } from "@/components/ui/button";
import { getBestSellerLeaderboard } from "@/lib/analytics/best-seller";
import { readResourceAnalyticsSettings } from "@/lib/analytics/settings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await requireTenantContext();
  const locale = await getAdminLocale();
  const messages = getAdminMessages(locale);
  const t = messages.dashboard;
  const analyticsT = messages.analytics;
  const resourceId = ctx.resource?.id;
  const analyticsSettings = readResourceAnalyticsSettings(ctx.resource?.socialJson);
  const canUseCharts = canUseAnalyticsCharts(ctx.organization.planId);
  const canUseAdvanced = canUseAdvancedAnalytics(ctx.organization.planId);

  const [menuCount, itemCount, qrDesignCount, events] = await Promise.all([
    resourceId ? db.menu.count({ where: { resourceId } }) : 0,
    resourceId
      ? db.item.count({
          where: { category: { menu: { resourceId } } },
        })
      : 0,
    resourceId ? db.qrDesign.count({ where: { resourceId } }) : 0,
    resourceId
      ? db.analyticsEvent.findMany({
          where: { resourceId },
          select: {
            id: true,
            type: true,
            metadataJson: true,
            locale: true,
            device: true,
            isReturning: true,
            ts: true,
          },
          orderBy: { ts: "desc" },
          take: 100,
        })
      : [],
  ]);
  const qrMetricLabel = locale === "es" ? "Diseños QR" : "QR designs";
  const bestSellerRows =
    resourceId && canUseCharts
      ? await getBestSellerLeaderboard({
          resourceId,
          days: 30,
          viewWeight: analyticsSettings.bestSellerViewWeight,
          clickWeight: analyticsSettings.bestSellerClickWeight,
          limit: 5,
          minInteractions: analyticsSettings.bestSellerMinInteractions,
        })
      : [];
  const scans = events.filter((e) => e.type === "SCAN").length;
  const views = events.filter((e) => e.type === "VIEW").length;
  const returning = events.filter((e) => e.isReturning).length;
  const byDay = new Map<string, { views: number; scans: number }>();
  const byLocale = new Map<string, number>();
  const byDevice = new Map<string, number>();
  let searchEvents = 0;
  let filterToggleEvents = 0;
  let categoryChangeEvents = 0;
  let firstClickSamples = 0;
  let firstClickMsTotal = 0;
  for (const event of events) {
    const day = event.ts.toISOString().slice(0, 10);
    byDay.set(day, {
      views: (byDay.get(day)?.views ?? 0) + (event.type === "VIEW" ? 1 : 0),
      scans: (byDay.get(day)?.scans ?? 0) + (event.type === "SCAN" ? 1 : 0),
    });
    byLocale.set(event.locale ?? analyticsT.na, (byLocale.get(event.locale ?? analyticsT.na) ?? 0) + 1);
    byDevice.set(
      event.device ?? analyticsT.unknown,
      (byDevice.get(event.device ?? analyticsT.unknown) ?? 0) + 1
    );
    const metadata =
      event.metadataJson && typeof event.metadataJson === "object"
        ? (event.metadataJson as Record<string, unknown>)
        : null;
    const uxEvent = typeof metadata?.uxEvent === "string" ? metadata.uxEvent : null;
    if (uxEvent === "SEARCH") searchEvents += 1;
    if (uxEvent === "DIET_FILTER_TOGGLE" || uxEvent === "FEATURED_TOGGLE") filterToggleEvents += 1;
    if (uxEvent === "CATEGORY_CHANGE") categoryChangeEvents += 1;
    if (uxEvent === "FIRST_ITEM_CLICK" && typeof metadata?.msFromOpen === "number") {
      firstClickSamples += 1;
      firstClickMsTotal += Number(metadata.msFromOpen);
    }
  }
  const avgFirstClickMs = firstClickSamples ? Math.round(firstClickMsTotal / firstClickSamples) : 0;
  const dayRows = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14);
  const localeRows = Array.from(byLocale.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const deviceRows = Array.from(byDevice.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxDay = Math.max(...dayRows.map((entry) => entry[1].views + entry[1].scans), 1);
  const checklist = [
    {
      label: t.checklist.resourceConfigured,
      done: Boolean(ctx.resource?.name),
      href: appRoutes.settings,
    },
    { label: t.checklist.atLeastOneMenu, done: menuCount > 0, href: appRoutes.items },
    { label: t.checklist.atLeastThreeItems, done: itemCount >= 3, href: appRoutes.items },
    {
      label: t.checklist.templateSelected,
      done: Boolean(ctx.resource?.templateId),
      href: appHref("items", { tab: "style-editor" }),
    },
    {
      label: t.checklist.qrDesignSaved,
      done: qrDesignCount > 0,
      href: appHref("items", { tab: "qr" }),
    },
  ];
  const checklistDone = checklist.every((step) => step.done);
  const checklistHidden = await getDashboardChecklistHidden(ctx.user.id);

  return (
    <div className="space-y-4">
      {!checklistHidden ? (
        <Card className="animate-in fade-in-50 slide-in-from-top-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent duration-500">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t.checklistTitle}</CardTitle>
              <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                Onboarding
              </span>
            </div>
            {checklistDone ? <p className="text-sm text-muted-foreground">{t.checklistDoneHint}</p> : null}
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {checklist.map((step) => (
              <div key={step.label} className="flex items-center justify-between rounded-md border border-primary/20 p-2">
                <span>{step.done ? "✓" : "○"} {step.label}</span>
                <Link href={step.href} className="text-primary underline underline-offset-4">
                  {t.open}
                </Link>
              </div>
            ))}
            {checklistDone ? (
              <form action={dismissDashboardChecklistAction}>
                <Button type="submit" variant="outline" className="mt-1">
                  {t.checklistDismiss}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      <h1 className="font-display text-2xl font-bold">{t.title}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric title={t.menus} value={menuCount} />
        <Metric title={t.items} value={itemCount} />
        <Metric title={qrMetricLabel} value={qrDesignCount} />
      </div>
      <div className="pt-2">
        <h2 className="font-display text-xl font-semibold">{analyticsT.title}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric title={analyticsT.scans} value={scans} />
        <Metric title={analyticsT.views} value={views} />
        <Metric title={analyticsT.returning} value={returning} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{analyticsT.latestEvents}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {events.map((e) => (
            <div key={e.id} className="rounded-md border p-2">
              {e.type} · {e.locale ?? analyticsT.na} · {e.device ?? analyticsT.unknown} ·{" "}
              {new Date(e.ts).toLocaleString()}
            </div>
          ))}
          {!events.length && <p className="text-muted-foreground">{analyticsT.emptyEvents}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{analyticsT.trendsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {canUseCharts ? (
            dayRows.map(([day, totals]) => {
              const value = totals.views + totals.scans;
              return (
                <div key={day}>
                  <div className="mb-1 flex justify-between">
                    <span>{day}</span>
                    <span>{value} {analyticsT.events}</span>
                  </div>
                  <progress className="h-2 w-full overflow-hidden rounded bg-muted" value={value} max={maxDay} />
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground">{analyticsT.chartsPaidOnly}</p>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{analyticsT.topLocales}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {canUseCharts ? (
              localeRows.map(([localeKey, total]) => (
                <div key={localeKey} className="flex justify-between">
                  <span>{localeKey}</span>
                  <span>{total}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">{analyticsT.localesPaidOnly}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{analyticsT.topDevices}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {canUseCharts ? (
              deviceRows.map(([deviceKey, total]) => (
                <div key={deviceKey} className="flex justify-between">
                  <span>{deviceKey}</span>
                  <span>{total}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">{analyticsT.devicesPaidOnly}</p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{locale === "es" ? "Top productos (interacción)" : "Top products (engagement)"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {canUseCharts ? (
            bestSellerRows.length ? (
              bestSellerRows.map((entry, index) => (
                <div key={entry.itemId} className="flex items-center justify-between gap-3 rounded-md border p-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      #{index + 1} {entry.itemName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.itemClicks} clicks · {entry.itemViews} views
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold uppercase text-muted-foreground">
                    score {entry.score}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                {locale === "es"
                  ? "Aún no hay interacciones por producto suficientes para ranking."
                  : "Not enough item interactions yet to build a ranking."}
              </p>
            )
          ) : (
            <p className="text-muted-foreground">{analyticsT.chartsPaidOnly}</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{locale === "es" ? "Embudo UX del menú" : "Menu UX funnel"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-md border p-2">
            <p className="text-xs text-muted-foreground">{locale === "es" ? "Cambios de categoría" : "Category changes"}</p>
            <p className="font-semibold">{categoryChangeEvents}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-muted-foreground">{locale === "es" ? "Uso de filtros" : "Filter usage"}</p>
            <p className="font-semibold">{filterToggleEvents}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-muted-foreground">{locale === "es" ? "Búsquedas ejecutadas" : "Searches executed"}</p>
            <p className="font-semibold">{searchEvents}</p>
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs text-muted-foreground">{locale === "es" ? "Tiempo medio al primer click" : "Avg time to first click"}</p>
            <p className="font-semibold">{avgFirstClickMs ? `${avgFirstClickMs} ms` : "-"}</p>
          </div>
        </CardContent>
      </Card>
      {canUseAdvanced ? (
        <Card>
          <CardHeader>
            <CardTitle>{analyticsT.advancedInsight}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {analyticsT.returningRatio}: {events.length ? Math.round((returning / events.length) * 100) : 0}%.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="font-display text-3xl font-bold">{value}</CardContent>
    </Card>
  );
}
