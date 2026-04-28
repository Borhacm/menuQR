import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const ctx = await requireTenantContext();
  const events = ctx.resource
    ? await db.analyticsEvent.findMany({
        where: { resourceId: ctx.resource.id },
        orderBy: { ts: "desc" },
        take: 100,
      })
    : [];

  const scans = events.filter((e) => e.type === "SCAN").length;
  const views = events.filter((e) => e.type === "VIEW").length;
  const returning = events.filter((e) => e.isReturning).length;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric title="Scans" value={scans} />
        <Metric title="Views" value={views} />
        <Metric title="Returning" value={returning} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Latest events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {events.map((e) => (
            <div key={e.id} className="rounded-md border p-2">
              {e.type} · {e.locale ?? "n/a"} · {e.device ?? "unknown"} ·{" "}
              {new Date(e.ts).toLocaleString()}
            </div>
          ))}
          {!events.length && <p className="text-muted-foreground">No events yet.</p>}
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
