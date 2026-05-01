import { redirect } from "next/navigation";

type AuthPath = "/login" | "/register" | "/onboarding";

export function authHref(
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

export function redirectToAuth(
  to: AuthPath,
  query?: Record<string, string | number | boolean | undefined>
): never {
  redirect(authHref(to, query));
}

export function authUrl(
  reqUrl: string,
  to: AuthPath,
  query?: Record<string, string | number | boolean | undefined>
) {
  return new URL(authHref(to, query), reqUrl);
}

