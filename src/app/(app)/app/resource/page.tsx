import { requireTenantContext } from "@/lib/auth/guards";
import { updateResourceAction } from "@/lib/admin/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function ResourcePage() {
  const ctx = await requireTenantContext();
  const resource = ctx.resource;

  if (!resource) {
    return <p className="text-sm text-muted-foreground">No resource found.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Resource settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Brand & domain</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateResourceAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" defaultValue={resource.name} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input name="slug" defaultValue={resource.slug} />
            </div>
            <div className="space-y-2">
              <Label>Default locale</Label>
              <Input name="defaultLocale" defaultValue={resource.defaultLocale} />
            </div>
            <div className="space-y-2">
              <Label>Default currency</Label>
              <Input name="defaultCurrency" defaultValue={resource.defaultCurrency} />
            </div>
            <div className="space-y-2">
              <Label>Primary color</Label>
              <Input name="primaryColor" defaultValue="#f97316" />
            </div>
            <div className="space-y-2">
              <Label>Background color</Label>
              <Input name="backgroundColor" defaultValue="#ffffff" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Save resource</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
