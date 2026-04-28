import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
  });
  if (membership) redirect("/app");

  return (
    <main className="container mx-auto max-w-2xl px-4 py-20">
      <h1 className="font-display text-3xl font-bold">Onboarding</h1>
      <p className="mt-4 text-muted-foreground">
        Your workspace is almost ready. Use registration flow to create your organization.
      </p>
    </main>
  );
}
