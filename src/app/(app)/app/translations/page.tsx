import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function TranslationsPage() {
  const ctx = await requireTenantContext();
  const rows = ctx.resource
    ? await db.translation.findMany({
        where: {
          entityType: "RESOURCE",
          entityId: ctx.resource.id,
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      })
    : [];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Translations</h1>
      <Card>
        <CardHeader>
          <CardTitle>AI translation queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action="/api/ai/translate" method="post">
            <Button type="submit">Translate menu now</Button>
          </form>
          <div className="space-y-2 text-sm">
            {rows.map((r) => (
              <div key={r.id} className="rounded-md border p-3">
                <div className="font-medium">
                  {r.locale} · {r.field} · {r.source}
                </div>
                <div className="text-muted-foreground">{r.value}</div>
              </div>
            ))}
            {!rows.length && <p className="text-muted-foreground">No translations yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
