import Stripe from "stripe";
import type { Express, Request, Response } from "express";
import * as db from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    // Raw body needed for signature verification - must be registered before express.json()
    // This is handled by placing this route registration BEFORE express.json() in index.ts
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: Stripe.Event;

      try {
        if (!webhookSecret || !sig) {
          console.warn("[Stripe Webhook] Missing secret or signature");
          return res.status(400).json({ error: "Missing webhook secret or signature" });
        }
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
            const plan = (session.metadata?.plan as "basic" | "premium" | "pro_max") || "basic";

            if (userId && session.subscription) {
              await db.upsertUserSubscription(userId, {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                status: "active",
                plan,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              });
              console.log(`[Stripe] Subscription activated for user ${userId}, plan: ${plan}`);
            }
            break;
          }

          case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            const customerId = sub.customer as string;
            // Find user by stripe customer id and update subscription status
            console.log(`[Stripe] Subscription updated: ${sub.id}, status: ${sub.status}`);
            break;
          }

          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            console.log(`[Stripe] Subscription cancelled: ${sub.id}`);
            break;
          }

          case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            console.log(`[Stripe] Invoice paid: ${invoice.id}`);
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Error processing event:", err);
        return res.status(500).json({ error: "Internal error processing webhook" });
      }

      res.json({ received: true });
    }
  );
}

export async function createCheckoutSession({
  userId,
  userEmail,
  userName,
  plan,
  origin,
}: {
  userId: number;
  userEmail: string | null;
  userName: string | null;
  plan: "basic" | "premium" | "pro_max";
  origin: string;
}) {
  const prices: Record<string, number> = {
    basic: 499,
    premium: 999,
    pro_max: 1999,
  };

  const planNames: Record<string, string> = {
    basic: "BuddyMarket Basic",
    premium: "BuddyMarket Premium",
    pro_max: "BuddyMarket Pro Max",
  };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    allow_promotion_codes: true,
    client_reference_id: userId.toString(),
    customer_email: userEmail || undefined,
    metadata: {
      user_id: userId.toString(),
      plan,
      customer_email: userEmail || "",
      customer_name: userName || "",
    },
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: planNames[plan],
            description: `Suscripción mensual al plan ${planNames[plan]}`,
          },
          unit_amount: prices[plan],
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard?subscription=success`,
    cancel_url: `${origin}/subscription?cancelled=true`,
  });

  return session;
}
