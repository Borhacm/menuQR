import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { setTenantCookieForUser } from "@/lib/auth/tenant";
import { authUrl } from "@/lib/auth/redirects";
import { isTrustedRequestOrigin } from "@/lib/security/request-origin";

export async function POST(req: Request) {
  if (!isTrustedRequestOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(authUrl(req.url, "/login"));
  }

  const formData = await req.formData();
  const organizationId = String(formData.get("organizationId") ?? "");
  const redirectToRaw = String(formData.get("redirectTo") ?? "/app");
  const redirectTo = redirectToRaw.startsWith("/") ? redirectToRaw : "/app";
  const redirectUrl = new URL(redirectTo, req.url);

  if (!organizationId) {
    return NextResponse.redirect(redirectUrl);
  }

  const switched = await setTenantCookieForUser(session.user.id, organizationId);
  if (switched) {
    redirectUrl.searchParams.set("tenant", "switched");
  }
  return NextResponse.redirect(redirectUrl);
}

