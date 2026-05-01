"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark";

const THEME_COOKIE_NAME = "APP_THEME";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  return (
    <div className={cn("inline-flex items-center rounded-md border border-border bg-card p-0.5", className)}>
      <button
        type="button"
        aria-label="Use light mode"
        onClick={() => {
          applyTheme("light");
          setTheme("light");
        }}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors",
          theme === "light" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Use dark mode"
        onClick={() => {
          applyTheme("dark");
          setTheme("dark");
        }}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors",
          theme === "dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
}
