import type Stripe from "stripe";

/**
 * Webhook処理が必要とする永続化操作。
 * 実装は Supabase admin クライアント（route側）、テストではフェイクを注入する。
 */
export interface PurchaseStore {
  /**
   * 決済セッションを paid にする。
   * 冪等性：既に paid なら alreadyPaid=true を返し、以降の処理をスキップできる。
   * 該当セッションが存在しなければ projectId=null。
   */
  markPurchasePaid(
    stripeSessionId: string,
    amountTotal: number | null
  ): Promise<{ projectId: string | null; alreadyPaid: boolean }>;
  /** プロジェクトを paid 状態へ進める（generated は上書きしない） */
  markProjectPaid(projectId: string): Promise<void>;
}

export interface WebhookResult {
  /** このイベントを処理したか（対象外イベントは false） */
  handled: boolean;
  projectId: string | null;
}

/**
 * Stripeイベントの処理本体（署名検証済みのイベントを受け取る）。
 * checkout.session.completed のみ対象。冪等（同一イベント再送で二重処理しない）。
 */
export async function handleStripeEvent(
  event: Stripe.Event,
  store: PurchaseStore
): Promise<WebhookResult> {
  if (event.type !== "checkout.session.completed") {
    return { handled: false, projectId: null };
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // 未入金（銀行振込等の遅延決済）は completed でも paid でない場合がある
  if (session.payment_status !== "paid") {
    return { handled: false, projectId: null };
  }

  const { projectId, alreadyPaid } = await store.markPurchasePaid(
    session.id,
    session.amount_total
  );
  if (!projectId || alreadyPaid) {
    return { handled: true, projectId };
  }

  await store.markProjectPaid(projectId);
  return { handled: true, projectId };
}
