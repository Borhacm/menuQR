import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirectToAuth } from "@/lib/auth/redirects";
import { completeOnboardingAction } from "@/lib/auth/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirectToAuth("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
  });
  if (membership) redirect("/app");

  return (
    <main className="container mx-auto max-w-3xl space-y-6 px-4 py-16">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Quick setup wizard</h1>
        <p className="text-sm text-muted-foreground">
          Configure your workspace and publish your first QR menu in minutes.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Setup steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Identity: business name and slug</p>
          <p>2. Defaults: language and currency</p>
          <p>3. Create first workspace</p>
          <p>4. Continue in /app with templates and QR</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={completeOnboardingAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Business name</Label>
              <Input name="name" placeholder="La Tasca Alicante" required />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input name="slug" placeholder="la-tasca" required />
            </div>
            <div className="space-y-2">
              <Label>Default language</Label>
              <Input name="defaultLocale" defaultValue="en" />
            </div>
            <div className="space-y-2">
              <Label>Default currency</Label>
              <Input name="defaultCurrency" defaultValue="EUR" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Create and continue</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
