import { requireTenantContext } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const ctx = await requireTenantContext();
  const resourceId = ctx.resource?.id;

  const [menuCount, itemCount, eventCount] = await Promise.all([
    resourceId ? db.menu.count({ where: { resourceId } }) : 0,
    resourceId
      ? db.item.count({
          where: { category: { menu: { resourceId } } },
        })
      : 0,
    resourceId ? db.analyticsEvent.count({ where: { resourceId } }) : 0,
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric title="Menus" value={menuCount} />
        <Metric title="Items" value={itemCount} />
        <Metric title="Events" value={eventCount} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Organization: {ctx.organization.name} · Plan: {ctx.organization.planId}
        </CardContent>
      </Card>
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
