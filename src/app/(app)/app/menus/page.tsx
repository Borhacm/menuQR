import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { createMenuAction } from "@/lib/admin/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function MenusPage() {
  const ctx = await requireTenantContext();
  const menus = ctx.resource
    ? await db.menu.findMany({
        where: { resourceId: ctx.resource.id },
        orderBy: { position: "asc" },
        include: { categories: true },
      })
    : [];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Menus</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create menu</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createMenuAction} className="flex gap-2">
            <Input name="name" placeholder="Dinner menu" />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing menus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {menus.map((m) => (
            <div key={m.id} className="rounded-md border p-3">
              <div className="font-medium">{m.name}</div>
              <div className="text-muted-foreground">{m.categories.length} categories</div>
            </div>
          ))}
          {!menus.length && <p className="text-muted-foreground">No menus yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
