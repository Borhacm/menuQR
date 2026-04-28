import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logEvent, metricIncr } from "@/lib/observability";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", req.url));

  const formData = await req.formData();
  const planId = String(formData.get("planId") ?? "standard");
  if (planId !== "standard" && planId !== "standard_plus") {
    metricIncr("stripe_checkout_invalid_plan_total");
    return NextResponse.redirect(new URL("/app/billing?status=invalid_plan", req.url));
  }
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });
  if (!membership) return NextResponse.redirect(new URL("/onboarding", req.url));

  const priceId =
    planId === "standard_plus"
      ? process.env.STRIPE_PRICE_STANDARD_PLUS
      : process.env.STRIPE_PRICE_STANDARD;

  if (!priceId || !process.env.STRIPE_SECRET_KEY) {
    metricIncr("stripe_checkout_missing_config_total");
    return NextResponse.redirect(new URL("/app/billing", req.url));
  }

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
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?status=cancel`,
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

  return NextResponse.redirect(checkout.url ?? `${process.env.NEXT_PUBLIC_APP_URL}/app/billing`);
}
