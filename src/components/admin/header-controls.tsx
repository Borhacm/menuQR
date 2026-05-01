"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type HeaderControlLabels = {
  language: string;
  languageEnglish: string;
  languageSpanish: string;
  account: string;
  profile: string;
  signOut: string;
};

export function AdminHeaderControls({
  labels,
  currentLocale,
  userEmail,
}: {
  labels: HeaderControlLabels;
  currentLocale: "en" | "es";
  userEmail?: string | null;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <label className="sr-only" htmlFor="admin-locale">
        {labels.language}
      </label>
      <select
        id="admin-locale"
        name="locale"
        defaultValue={currentLocale}
        aria-label={labels.language}
        className="h-9 rounded-md border border-border bg-card px-3 text-sm"
        onChange={(event) => {
          const locale = event.currentTarget.value === "es" ? "es" : "en";
          document.cookie = `NEXT_LOCALE=${locale}; Path=/; SameSite=Lax`;
          router.refresh();
        }}
      >
        <option value="en">{labels.languageEnglish}</option>
        <option value="es">{labels.languageSpanish}</option>
      </select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {labels.account}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {userEmail ? <DropdownMenuLabel>{userEmail}</DropdownMenuLabel> : null}
          {userEmail ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem asChild>
            <Link href="/app/settings">{labels.profile}</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              void signOut({ callbackUrl: "/" });
            }}
          >
            {labels.signOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
