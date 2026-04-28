import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { saveQrDesignAction } from "@/lib/admin/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function QrPage() {
  const ctx = await requireTenantContext();
  const designs = ctx.resource
    ? await db.qrDesign.findMany({
        where: { resourceId: ctx.resource.id },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const targetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/m/${ctx.resource?.slug ?? "demo"}`;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">QR Generator</h1>
      <Card>
        <CardHeader>
          <CardTitle>Design your QR</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveQrDesignAction} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Dots color</Label>
              <Input name="dotsColor" defaultValue="#111111" />
            </div>
            <div className="space-y-2">
              <Label>Background color</Label>
              <Input name="bgColor" defaultValue="#ffffff" />
            </div>
            <div className="space-y-2">
              <Label>Corner style</Label>
              <Input name="cornerStyle" defaultValue="square" />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input name="logoUrl" placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Save design</Button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/api/qr/export?url=${encodeURIComponent(targetUrl)}&format=png`}>Export PNG</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/api/qr/export?url=${encodeURIComponent(targetUrl)}&format=svg`}>Export SVG</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/api/qr/export?url=${encodeURIComponent(targetUrl)}&format=pdf`}>Export PDF</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved designs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {designs.map((d) => (
            <div key={d.id} className="rounded-md border p-3">
              <div className="font-medium">{d.name}</div>
              <div className="text-muted-foreground">
                {new Date(d.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {!designs.length && <p className="text-muted-foreground">No designs yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
