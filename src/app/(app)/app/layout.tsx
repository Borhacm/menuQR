import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { requireTenantContext } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getAdminLocale, getAdminMessages } from "@/lib/admin/i18n";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireTenantContext();
  const locale = await getAdminLocale();
  const t = getAdminMessages(locale);
  const memberships = await db.membership.findMany({
    where: { userId: ctx.user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        organizationName={ctx.organization.name}
        activeOrganizationId={ctx.organization.id}
        labels={{
          nav: t.nav,
          activeOrganization: t.sidebar.activeOrganization,
          workspace: t.sidebar.workspace,
          organizationUpdated: t.sidebar.organizationUpdated,
          organizationSelector: t.sidebar.organizationSelector,
        }}
        organizations={memberships.map((membership) => ({
          id: membership.organization.id,
          name: membership.organization.name,
        }))}
      />
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <AdminHeader labels={t.header} currentLocale={locale} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
