import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe/client";
import { logEvent, metricIncr } from "@/lib/observability";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", req.url));

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  const customerId = membership?.organization.stripeCustomerId;
  if (!customerId || !process.env.STRIPE_SECRET_KEY) {
    metricIncr("stripe_portal_missing_config_total");
    return NextResponse.redirect(new URL("/app/billing", req.url));
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing`,
  });
  metricIncr("stripe_portal_created_total");
  logEvent("info", "stripe.portal.created", {
    orgId: membership.organization.id,
    customerId,
  });

  return NextResponse.redirect(portal.url);
}
