import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import { inviteManagerAction } from "@/lib/admin/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function TeamPage() {
  const ctx = await requireTenantContext();
  const members = await db.membership.findMany({
    where: { organizationId: ctx.organization.id },
    include: { user: true },
  });
  const invites = await db.orgInvite.findMany({
    where: { organizationId: ctx.organization.id, acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Team</h1>
      <Card>
        <CardHeader>
          <CardTitle>Invite manager</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={inviteManagerAction} className="flex gap-2">
            <Input name="email" placeholder="manager@restaurant.com" />
            <Button type="submit">Invite</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {members.map((m) => (
            <div key={m.id} className="rounded-md border p-2">
              {m.user.email} · {m.role}
            </div>
          ))}
          {invites.map((i) => (
            <div key={i.id} className="rounded-md border border-dashed p-2 text-muted-foreground">
              Invite pending: {i.email}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
