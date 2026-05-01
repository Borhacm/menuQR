"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Grid3x3,
  Palette,
  QrCode,
  CreditCard,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { appRoutes } from "@/lib/routes";
import { toast } from "sonner";

export function AdminSidebar({
  organizationName,
  activeOrganizationId,
  labels,
  organizations,
}: {
  organizationName?: string;
  activeOrganizationId?: string;
  labels: {
    nav: {
      dashboard: string;
      businessProfile: string;
      menus: string;
      items: string;
      templates: string;
      translations: string;
      qr: string;
      analytics: string;
      billing: string;
      team: string;
      settings: string;
    };
    activeOrganization: string;
    workspace: string;
    organizationUpdated: string;
    organizationSelector: string;
  };
  organizations?: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantStatus = searchParams.get("tenant");

  useEffect(() => {
    if (tenantStatus !== "switched") return;
    toast.success(labels.organizationUpdated);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("tenant");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [labels.organizationUpdated, pathname, router, searchParams, tenantStatus]);
  const nav = [
    { href: appRoutes.dashboard, icon: LayoutDashboard, label: labels.nav.dashboard },
    { href: appRoutes.items, icon: Grid3x3, label: labels.nav.items },
    { href: appRoutes.templates, icon: Palette, label: labels.nav.templates },
    { href: appRoutes.qr, icon: QrCode, label: labels.nav.qr },
    { href: appRoutes.billing, icon: CreditCard, label: labels.nav.billing },
    { href: appRoutes.team, icon: Users, label: labels.nav.team },
    { href: appRoutes.settings, icon: Settings, label: labels.nav.settings },
  ];
  const isNavActive = (href: string) => {
    if (href === appRoutes.dashboard) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/80 backdrop-blur lg:block">
        <div className="border-b border-border/60 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{labels.activeOrganization}</p>
          <p className="truncate text-sm font-semibold text-foreground">{organizationName ?? labels.workspace}</p>
          {organizations && organizations.length > 1 ? (
            <form action="/api/tenant/select" method="post" className="mt-2 flex items-center gap-1.5">
              <input type="hidden" name="redirectTo" value={pathname || "/app"} />
              <select
                name="organizationId"
                defaultValue={activeOrganizationId}
                aria-label={labels.organizationSelector}
                className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </form>
          ) : null}
        </div>
        <nav className="space-y-1 p-4">
          {nav.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm transition-all",
                  active
                    ? "border-primary/60 bg-primary text-primary-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
                    : "text-muted-foreground hover:border-border hover:bg-accent/10 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 py-1 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          {nav.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center rounded-md px-1 text-[11px] leading-tight transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent/20 hover:text-foreground"
                )}
              >
                <item.icon className="mb-0.5 h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
