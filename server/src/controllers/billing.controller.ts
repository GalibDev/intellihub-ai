import type { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { User } from "../models/index.js";
import { ApiError, ok } from "../utils/http.js";

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

function requireStripe() {
  if (!stripe) {
    throw new ApiError(
      503,
      "Billing is not configured yet. Add STRIPE_SECRET_KEY to Render.",
    );
  }
  return stripe;
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string,
) {
  const status =
    subscription.status === "unpaid"
      ? "past_due"
      : subscription.status === "incomplete_expired"
        ? "canceled"
        : subscription.status;
  const normalizedStatus = [
    "active",
    "trialing",
    "past_due",
    "canceled",
  ].includes(status)
    ? status
    : "inactive";
  const periodEnd = Math.max(
    ...subscription.items.data.map((item) => item.current_period_end),
    0,
  );
  const isPro = ["active", "trialing"].includes(normalizedStatus);
  const userId = subscription.metadata.userId || fallbackUserId;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const filter = userId ? { _id: userId } : { stripeCustomerId: customerId };

  await User.findOneAndUpdate(filter, {
    plan: isPro ? "pro" : "free",
    subscriptionStatus: normalizedStatus,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    subscriptionCurrentPeriodEnd: periodEnd
      ? new Date(periodEnd * 1000)
      : undefined,
  });
}

export async function checkout(req: Request, res: Response) {
  const client = requireStripe();
  if (
    req.user!.plan === "pro" &&
    ["active", "trialing"].includes(req.user!.subscriptionStatus || "")
  ) {
    throw new ApiError(409, "Your Image Pro subscription is already active");
  }
  let customerId = req.user!.stripeCustomerId;
  if (!customerId) {
    const customer = await client.customers.create({
      email: req.user!.email,
      name: req.user!.name,
      metadata: { userId: String(req.user!._id) },
    });
    customerId = customer.id;
    await User.findByIdAndUpdate(req.user!._id, {
      stripeCustomerId: customerId,
    });
  }

  const session = await client.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: 1000,
          recurring: { interval: "month" },
          product_data: {
            name: "IntelliHub Image Pro",
            description: "Unlimited AI image generations",
          },
        },
      },
    ],
    metadata: { userId: String(req.user!._id) },
    subscription_data: { metadata: { userId: String(req.user!._id) } },
    success_url: `${env.CLIENT_URL.replace(/\/$/, "")}/ai/image-generator?upgrade=success`,
    cancel_url: `${env.CLIENT_URL.replace(/\/$/, "")}/ai/image-generator?upgrade=canceled`,
    allow_promotion_codes: true,
  });
  if (!session.url)
    throw new ApiError(502, "Stripe did not return a checkout URL");
  return ok(res, { url: session.url }, "Checkout created", 201);
}

export async function webhook(req: Request, res: Response) {
  const client = requireStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new ApiError(503, "STRIPE_WEBHOOK_SECRET is not configured");
  }
  const signature = req.headers["stripe-signature"];
  if (!signature) throw new ApiError(400, "Missing Stripe signature");
  const event = client.webhooks.constructEvent(
    req.body as Buffer,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.subscription) {
      const subscription = await client.subscriptions.retrieve(
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id,
      );
      await syncSubscription(subscription, session.metadata?.userId);
    }
  }
  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await syncSubscription(event.data.object);
  }

  return res.json({ received: true });
}
