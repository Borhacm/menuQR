import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { logEvent, metricIncr } from "@/lib/observability";

function mapStripeStatus(
  status: Stripe.Subscription.Status | null | undefined
): "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
      return "INCOMPLETE";
    default:
      return "ACTIVE";
  }
}

function inferPlanIdFromPrice(priceId: string | null | undefined) {
  if (!priceId) return "standard";
  if (
    process.env.STRIPE_PRICE_STANDARD_PLUS &&
    priceId === process.env.STRIPE_PRICE_STANDARD_PLUS
  ) {
    return "standard_plus";
  }
  if (process.env.STRIPE_PRICE_STANDARD && priceId === process.env.STRIPE_PRICE_STANDARD) {
    return "standard";
  }
  return "standard";
}

export async function POST(req: NextRequest) {
  metricIncr("stripe_webhook_requests_total");
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    metricIncr("stripe_webhook_invalid_total");
    return NextResponse.json({ error: "Missing webhook setup" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (e) {
    metricIncr("stripe_webhook_invalid_total");
    logEvent("warn", "stripe.webhook.invalid_signature", {
      message: e instanceof Error ? e.message : "Unknown",
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid signature" },
      { status: 400 }
    );
  }
  logEvent("info", "stripe.webhook.received", { eventId: event.id, eventType: event.type });

  const existingReceipt = await db.webhookReceipt.findUnique({
    where: {
      provider_eventId: {
        provider: "stripe",
        eventId: event.id,
      },
    },
  });
  if (existingReceipt?.processedAt) {
    metricIncr("stripe_webhook_duplicate_total");
    logEvent("info", "stripe.webhook.duplicate_ignored", { eventId: event.id });
    return NextResponse.json({ received: true, duplicate: true });
  }
  const receipt = existingReceipt
    ? await db.webhookReceipt.update({
        where: { id: existingReceipt.id },
        data: { status: "RECEIVED", error: null },
      })
    : await db.webhookReceipt.create({
        data: {
          provider: "stripe",
          eventId: event.id,
          eventType: event.type,
          status: "RECEIVED",
        },
      });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organizationId;
      const planId = session.metadata?.planId ?? "standard";
      const customerId = typeof session.customer === "string" ? session.customer : null;
      if (orgId) {
        await db.organization.update({
          where: { id: orgId },
          data: {
            planId,
            stripeCustomerId: customerId ?? undefined,
          },
        });
        await db.subscription.upsert({
          where: { organizationId: orgId },
          update: {
            planId,
            status: "ACTIVE",
            stripeSubscriptionId: String(session.subscription ?? ""),
          },
          create: {
            organizationId: orgId,
            planId,
            status: "ACTIVE",
            stripeSubscriptionId: String(session.subscription ?? ""),
          },
        });
      }
      metricIncr("stripe_webhook_checkout_completed_total");
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const stripeSubscriptionId = sub.id;
      const priceId = sub.items.data[0]?.price?.id ?? null;
      const status = mapStripeStatus(sub.status);
      const planId = inferPlanIdFromPrice(priceId);
      const currentPeriodEnd =
        typeof sub.current_period_end === "number"
          ? new Date(sub.current_period_end * 1000)
          : null;

      const existing = await db.subscription.findUnique({
        where: { stripeSubscriptionId },
        include: { organization: true },
      });
      if (existing) {
        await db.subscription.update({
          where: { id: existing.id },
          data: {
            status,
            stripePriceId: priceId,
            planId,
            currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });
        await db.organization.update({
          where: { id: existing.organizationId },
          data: {
            planId: status === "CANCELED" ? "free" : planId,
          },
        });
      }
      metricIncr("stripe_webhook_subscription_lifecycle_total");
    }
    await db.webhookReceipt.update({
      where: { id: receipt.id },
      data: { status: "PROCESSED", processedAt: new Date(), error: null },
    });
    metricIncr("stripe_webhook_processed_total");
  } catch (e) {
    metricIncr("stripe_webhook_failed_total");
    await db.webhookReceipt.update({
      where: { id: receipt.id },
      data: {
        status: "FAILED",
        error: e instanceof Error ? e.message : "Unknown error",
      },
    });
    logEvent("error", "stripe.webhook.processing_failed", {
      eventId: event.id,
      eventType: event.type,
      message: e instanceof Error ? e.message : "Unknown",
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
