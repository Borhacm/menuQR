import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", req.url));

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  const customerId = membership?.organization.stripeCustomerId;
  if (!customerId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(new URL("/app/billing", req.url));
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing`,
  });

  return NextResponse.redirect(portal.url);
}
