import { auth } from "@/auth";
import { redirectToAuth } from "@/lib/auth/redirects";
import { resolveTenantMembership } from "@/lib/auth/tenant";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirectToAuth("/login");
  return session.user;
}

export async function requireTenantContext() {
  const user = await requireUser();
  const membership = await resolveTenantMembership(user.id);

  if (!membership) redirectToAuth("/onboarding");

  return {
    user,
    membership,
    organization: membership.organization,
    resource: membership.organization.resources[0] ?? null,
  };
}
