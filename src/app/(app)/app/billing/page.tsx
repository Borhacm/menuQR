import { requireTenantContext } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function BillingPage() {
  const ctx = await requireTenantContext();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Billing</h1>
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Plan: <strong>{ctx.organization.planId}</strong>
          </p>
          <form action="/api/stripe/checkout" method="post" className="flex gap-2">
            <input type="hidden" name="planId" value="standard" />
            <Button type="submit">Upgrade to Standard</Button>
          </form>
          <form action="/api/stripe/portal" method="post">
            <Button type="submit" variant="outline">
              Open customer portal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
