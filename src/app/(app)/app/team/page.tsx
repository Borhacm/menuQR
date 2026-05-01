import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/auth/guards";
import {
  inviteManagerAction,
  removeMemberAction,
  resendInviteAction,
} from "@/lib/admin/team-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAdminLocale, getAdminMessages } from "@/lib/admin/i18n";
import { teamInviteStatus } from "@/lib/routes";

type TeamPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const ctx = await requireTenantContext();
  const locale = await getAdminLocale();
  const t = getAdminMessages(locale).team;
  const params = (await searchParams) ?? {};
  const inviteStatus = typeof params.invite === "string" ? params.invite : undefined;
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const isOwner = ctx.membership.role === "OWNER";
  const members = await db.membership.findMany({
    where: { organizationId: ctx.organization.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  const invites = await db.orgInvite.findMany({
    where: { organizationId: ctx.organization.id, acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });
  const inviteFeedback =
    inviteStatus === teamInviteStatus.invited
      ? t.invited
      : inviteStatus === teamInviteStatus.alreadyMember
        ? t.alreadyMember
        : inviteStatus === teamInviteStatus.alreadyPending
          ? t.alreadyPending
          : null;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{t.title}</h1>
      {inviteFeedback ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {inviteFeedback}
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{t.inviteTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={inviteManagerAction} className="flex flex-col gap-2 sm:flex-row">
            <Input name="email" placeholder={t.invitePlaceholder} />
            <Button type="submit">{t.invite}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t.membersTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {members.map((m) => (
            <div key={m.id} className="rounded-md border p-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  {m.user.email}
                  {m.userId === ctx.user.id ? ` · ${t.you}` : ""}
                </p>
                {isOwner ? (
                  <div className="flex flex-wrap gap-2">
                    {m.userId !== ctx.user.id ? (
                      <form action={removeMemberAction}>
                        <input type="hidden" name="memberId" value={m.id} />
                        <Button type="submit" size="sm" variant="outline">
                          {t.removeMember}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {invites.map((i) => (
            <div key={i.id} className="rounded-md border border-dashed p-2 text-muted-foreground">
              {t.invitePending}: {i.email}
              <div className="mt-1 text-xs">
                {t.inviteLink}:{" "}
                <a
                  className="text-primary underline underline-offset-4"
                  href={`${appBaseUrl}/invite/${i.token}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {appBaseUrl}/invite/{i.token}
                </a>
              </div>
              {isOwner ? (
                <form action={resendInviteAction} className="mt-2">
                  <input type="hidden" name="inviteId" value={i.id} />
                  <Button type="submit" size="sm" variant="outline">
                    {t.resendInvite}
                  </Button>
                </form>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
