"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "./locale-switcher";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AuthLink } from "@/components/auth/auth-link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function MarketingHeader() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/solutions", label: t("solutions") },
    { href: "/pricing", label: t("pricing") },
    { href: "/faq", label: t("faq") },
    { href: "/contacts", label: t("contacts") },
    { href: "/blog", label: t("blog") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo linkMark={false} />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <LocaleSwitcher />
          <Button asChild variant="ghost" size="sm">
            <AuthLink to="/login">{t("signIn")}</AuthLink>
          </Button>
          <Button asChild size="sm">
            <AuthLink to="/register">{t("signUp")}</AuthLink>
          </Button>
        </div>

        <button
          type="button"
          aria-label={t("toggleMenu")}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent/10"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "lg:hidden border-t border-border/50 overflow-hidden transition-all",
          open ? "max-h-[480px]" : "max-h-0"
        )}
      >
        <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent/10"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-2">
            <ThemeToggle />
            <LocaleSwitcher />
            <Button asChild variant="outline" size="sm" className="flex-1">
              <AuthLink to="/login">{t("signIn")}</AuthLink>
            </Button>
            <Button asChild size="sm" className="flex-1">
              <AuthLink to="/register">{t("signUp")}</AuthLink>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
