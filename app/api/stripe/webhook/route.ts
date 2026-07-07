import { NextResponse, type NextRequest } from "next/server";
import { createStripe } from "@/lib/stripe/client";
import { handleStripeEvent, type PurchaseStore } from "@/lib/stripe/webhook";
import { createAdminClient } from "@/lib/supabase/admin";

/** Supabase を使った PurchaseStore 実装 */
function createStore(): PurchaseStore {
  const admin = createAdminClient();
  return {
    async markPurchasePaid(stripeSessionId, amountTotal) {
      const { data: purchase } = await admin
        .from("purchases")
        .select("id, project_id, status")
        .eq("stripe_session_id", stripeSessionId)
        .maybeSingle();
      if (!purchase) return { projectId: null, alreadyPaid: false };
      if (purchase.status === "paid") {
        return { projectId: purchase.project_id, alreadyPaid: true };
      }
      await admin
        .from("purchases")
        .update({
          status: "paid",
          ...(amountTotal !== null ? { amount: amountTotal } : {}),
        })
        .eq("id", purchase.id);
      return { projectId: purchase.project_id, alreadyPaid: false };
    },
    async markProjectPaid(projectId) {
      // generated（PDF作成済み）は巻き戻さない
      await admin
        .from("projects")
        .update({ status: "paid" })
        .eq("id", projectId)
        .neq("status", "generated");
    },
  };
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "no_signature" }, { status: 400 });
  }

  // 署名検証は生ボディで行う（JSONパース前）
  const body = await request.text();
  const stripe = createStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event, createStore());
    return NextResponse.json({ received: true, handled: result.handled });
  } catch {
    // 500を返すとStripeが再送してくれる（処理は冪等なので安全）
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
