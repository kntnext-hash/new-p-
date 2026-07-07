import Stripe from "stripe";

/** サーバー専用 Stripe クライアント */
export function createStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}
