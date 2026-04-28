import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { createItemAction } from "@/lib/admin/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function ItemsPage() {
  const ctx = await requireTenantContext();
  const items = ctx.resource
    ? await db.item.findMany({
        where: { category: { menu: { resourceId: ctx.resource.id } } },
        include: { prices: true, category: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Items</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create item</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createItemAction} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" placeholder="Margherita" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="description" placeholder="Tomato, mozzarella, basil" />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input name="price" type="number" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input name="currency" defaultValue="EUR" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Save item</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border p-3">
              <div className="font-medium">{item.name}</div>
              <div className="text-muted-foreground">{item.description}</div>
              <div className="mt-1">
                {item.prices.map((p) => (
                  <span key={p.id} className="mr-2 text-xs text-primary">
                    {p.currency} {String(p.amount)}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {!items.length && <p className="text-muted-foreground">No items yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
