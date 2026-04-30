import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authHref } from "@/lib/auth/redirects";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(authHref("/login", { next: `/invite/${token}` }));
  }

  return (
    <main className="container mx-auto flex min-h-[80vh] max-w-3xl items-center px-4 py-16">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Team invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You are about to accept a team invitation with your current account.
          </p>
          <form action="/api/team/accept" method="post">
            <input type="hidden" name="token" value={token} />
            <Button type="submit">Accept invitation</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
