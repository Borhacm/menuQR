import Link from "next/link";

type AuthPath = "/login" | "/register";

export function AuthLink({
  to,
  query,
  className,
  children,
  ...props
}: {
  to: AuthPath;
  query?: Record<string, string | number | boolean | undefined>;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "children" | "className">) {
  const href = buildAuthHref(to, query);
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
}

function buildAuthHref(
  to: AuthPath,
  query?: Record<string, string | number | boolean | undefined>
) {
  if (!query) return to;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  const q = params.toString();
  return q ? `${to}?${q}` : to;
}
