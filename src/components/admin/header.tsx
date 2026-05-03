import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/logo";
import { db } from "@/lib/db";
import Link from "next/link";
import { appRoutes } from "@/lib/routes";
import { brand } from "@/config/brand";
import { resolveTenantMembership, setTenantCookieForUser } from "@/lib/auth/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminHeaderControls } from "@/components/admin/header-controls";

export async function AdminHeader({
  labels,
  currentLocale,
}: {
  labels: {
    switch: string;
    signOut: string;
    organizationSelector: string;
    language: string;
    languageEnglish: string;
    languageSpanish: string;
    saveLanguage: string;
    account: string;
    profile: string;
  };
  currentLocale: "en" | "es";
}) {
  const session = await auth();
  const memberships = session?.user?.id
    ? await db.membership.findMany({
        where: { userId: session.user.id },
        include: { organization: true },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const activeMembership = session?.user?.id ? await resolveTenantMembership(session.user.id) : null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <Link
        href={appRoutes.dashboard}
        className="-m-2 inline-flex rounded-md p-2 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`${brand.name} app`}
      >
        <Logo className="text-base" linkMark={false} />
      </Link>
      <div className="flex items-center gap-2">
        {memberships.length > 1 ? (
          <form
            action={async (formData) => {
              "use server";
              const user = await auth();
              if (!user?.user?.id) return;
              const organizationId = String(formData.get("organizationId") ?? "");
              if (!organizationId) return;

              const ok = await setTenantCookieForUser(user.user.id, organizationId);
              if (!ok) return;

              revalidatePath("/app");
              redirect("/app");
            }}
          >
            <select
              name="organizationId"
              defaultValue={activeMembership?.organizationId}
              aria-label={labels.organizationSelector}
              className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            >
              {memberships.map((membership) => (
                <option key={membership.organizationId} value={membership.organizationId}>
                  {membership.organization.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" size="sm" className="ml-2">
              {labels.switch}
            </Button>
          </form>
        ) : null}

        <AdminHeaderControls labels={labels} currentLocale={currentLocale} userEmail={session?.user?.email} />
      </div>
    </header>
  );
}
