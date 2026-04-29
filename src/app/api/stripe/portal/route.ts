import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe/client";
import { logEvent, metricIncr } from "@/lib/observability";
import { authUrl } from "@/lib/auth/redirects";
import { appUrl } from "@/lib/routes";
import { resolveTenantMembership } from "@/lib/auth/tenant";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(authUrl(req.url, "/login"));

  const membership = await resolveTenantMembership(session.user.id);

  const customerId = membership?.organization.stripeCustomerId;
  if (!customerId || !process.env.STRIPE_SECRET_KEY) {
    metricIncr("stripe_portal_missing_config_total");
    return NextResponse.redirect(appUrl(req.url, "billing"));
  }
  const stripe = getStripeClient();

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}${appUrl(req.url, "billing").pathname}`,
  });
  metricIncr("stripe_portal_created_total");
  logEvent("info", "stripe.portal.created", {
    orgId: membership.organization.id,
    customerId,
  });

  return NextResponse.redirect(portal.url);
}
