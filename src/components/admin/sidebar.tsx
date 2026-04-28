"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  Grid3x3,
  Palette,
  Languages,
  QrCode,
  BarChart3,
  CreditCard,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/app/resource", icon: Store, label: "Resource" },
  { href: "/app/menus", icon: UtensilsCrossed, label: "Menus" },
  { href: "/app/items", icon: Grid3x3, label: "Items" },
  { href: "/app/templates", icon: Palette, label: "Templates" },
  { href: "/app/translations", icon: Languages, label: "Translations" },
  { href: "/app/qr", icon: QrCode, label: "QR" },
  { href: "/app/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/app/billing", icon: CreditCard, label: "Billing" },
  { href: "/app/team", icon: Users, label: "Team" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <nav className="space-y-1 p-4">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
