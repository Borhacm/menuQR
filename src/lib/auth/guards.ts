import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requireTenantContext() {
  const user = await requireUser();
  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: {
      organization: {
        include: {
          resources: {
            orderBy: { createdAt: "asc" },
          },
          subscription: true,
        },
      },
    },
  });

  if (!membership) redirect("/onboarding");

  return {
    user,
    membership,
    organization: membership.organization,
    resource: membership.organization.resources[0] ?? null,
  };
}
