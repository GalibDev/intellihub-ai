import type { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { Tool, ToolSubscription, User } from "../models/index.js";
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

  if (subscription.metadata.kind === "tool") {
    const toolId = subscription.metadata.toolId;
    if (!userId || !toolId) return;
    await ToolSubscription.findOneAndUpdate(
      { user: userId, tool: toolId },
      {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        status: normalizedStatus,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
      },
      { upsert: true, new: true, runValidators: true },
    );
    return;
  }

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
    metadata: { userId: String(req.user!._id), kind: "image-pro" },
    subscription_data: {
      metadata: { userId: String(req.user!._id), kind: "image-pro" },
    },
    success_url: `${env.CLIENT_URL.replace(/\/$/, "")}/ai/image-generator?upgrade=success`,
    cancel_url: `${env.CLIENT_URL.replace(/\/$/, "")}/ai/image-generator?upgrade=canceled`,
    allow_promotion_codes: true,
  });
  if (!session.url)
    throw new ApiError(502, "Stripe did not return a checkout URL");
  return ok(res, { url: session.url }, "Checkout created", 201);
}

export async function checkoutTool(req: Request, res: Response) {
  const client = requireStripe();
  const tool = await Tool.findOne({
    _id: req.params.toolId,
    isPublished: true,
  });
  if (!tool) throw new ApiError(404, "Tool not found");
  if (tool.price <= 0) throw new ApiError(400, "This tool is already free");

  const existing = await ToolSubscription.findOne({
    user: req.user!._id,
    tool: tool._id,
    status: { $in: ["active", "trialing"] },
  });
  if (existing) throw new ApiError(409, "You already purchased this tool");

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

  const metadata = {
    userId: String(req.user!._id),
    toolId: String(tool._id),
    kind: "tool",
  };
  const session = await client.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(tool.price * 100),
          recurring: { interval: "month" },
          product_data: {
            name: tool.title,
            description: tool.shortDescription,
          },
        },
      },
    ],
    metadata,
    subscription_data: { metadata },
    success_url: `${env.CLIENT_URL.replace(/\/$/, "")}/tools/${tool.slug}?purchase=success`,
    cancel_url: `${env.CLIENT_URL.replace(/\/$/, "")}/tools/${tool.slug}?purchase=canceled`,
    allow_promotion_codes: true,
  });
  if (!session.url)
    throw new ApiError(502, "Stripe did not return a checkout URL");
  return ok(res, { url: session.url }, "Tool checkout created", 201);
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
