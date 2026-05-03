import { brand } from "@/config/brand";
import { getMarketingSiteUrl } from "@/config/marketing-site-url";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /**
   * When false, the square mark is not wrapped in `<a>`.
   * Use when the whole logo sits inside navigation (`<Link>`) to avoid invalid nested anchors.
   */
  linkMark?: boolean;
};

export function Logo({ className, linkMark = true }: LogoProps) {
  const href = linkMark ? getMarketingSiteUrl() : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display font-bold text-foreground",
        className
      )}
    >
      {href ? (
        <a
          href={href}
          className={cn(
            "inline-flex shrink-0 rounded-md outline-none ring-offset-background transition-opacity hover:opacity-90",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label={`${brand.name} home`}
        >
          <LogoMark />
        </a>
      ) : (
        <LogoMark />
      )}
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
