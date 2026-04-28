import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display font-bold text-foreground",
        className
      )}
    >
      <LogoMark />
      <span>{brand.name}</span>
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-7 w-7", className)}
    >
      <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
      <path
        d="M9 22V10h2.5l4 6 4-6H22v12h-2.5v-7.4l-3.2 4.8h-1.4l-3.2-4.8V22H9z"
        fill="white"
      />
      <circle cx="22" cy="22" r="2" fill="white" />
    </svg>
  );
}
