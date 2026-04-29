import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logEvent, metricIncr } from "@/lib/observability";
import { authUrl } from "@/lib/auth/redirects";
import { appHref, appUrl, billingStatus } from "@/lib/routes";
import { resolveTenantMembership } from "@/lib/auth/tenant";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(authUrl(req.url, "/login"));

  const formData = await req.formData();
  const planId = String(formData.get("planId") ?? "starter");
  if (planId !== "starter" && planId !== "pro") {
    metricIncr("stripe_checkout_invalid_plan_total");
    return NextResponse.redirect(
      appUrl(req.url, "billing", { status: billingStatus.invalidPlan })
    );
  }
  const membership = await resolveTenantMembership(session.user.id);
  if (!membership) return NextResponse.redirect(authUrl(req.url, "/onboarding"));

  const priceId =
    planId === "pro"
      ? process.env.STRIPE_PRICE_PRO ?? process.env.STRIPE_PRICE_STANDARD_PLUS
      : process.env.STRIPE_PRICE_STARTER ?? process.env.STRIPE_PRICE_STANDARD;

  if (!priceId || !process.env.STRIPE_SECRET_KEY) {
    metricIncr("stripe_checkout_missing_config_total");
    return NextResponse.redirect(appUrl(req.url, "billing"));
  }
  const stripe = getStripeClient();

  let customerId = membership.organization.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: membership.organization.name,
      metadata: {
        organizationId: membership.organization.id,
      },
    });
    customerId = customer.id;
    await db.organization.update({
      where: { id: membership.organization.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}${appHref("billing", {
      status: billingStatus.success,
    })}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}${appHref("billing", {
      status: billingStatus.cancel,
    })}`,
    metadata: {
      organizationId: membership.organization.id,
      planId,
    },
  });
  metricIncr("stripe_checkout_created_total");
  logEvent("info", "stripe.checkout.created", {
    orgId: membership.organization.id,
    planId,
    checkoutId: checkout.id,
  });
  return NextResponse.redirect(
    checkout.url ?? `${process.env.NEXT_PUBLIC_APP_URL}${appHref("billing")}`
  );
}
