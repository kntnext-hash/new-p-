import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { handleStripeEvent, type PurchaseStore } from "../webhook";

function makeEvent(
  type: string,
  session: Partial<Stripe.Checkout.Session>
): Stripe.Event {
  return {
    type,
    data: { object: session },
  } as unknown as Stripe.Event;
}

function makeStore(overrides?: {
  projectId?: string | null;
  alreadyPaid?: boolean;
}): PurchaseStore & {
  markPurchasePaid: ReturnType<typeof vi.fn>;
  markProjectPaid: ReturnType<typeof vi.fn>;
} {
  return {
    markPurchasePaid: vi.fn().mockResolvedValue({
      projectId:
        overrides && "projectId" in overrides ? overrides.projectId : "proj-1",
      alreadyPaid: overrides?.alreadyPaid ?? false,
    }),
    markProjectPaid: vi.fn().mockResolvedValue(undefined),
  };
}

describe("handleStripeEvent", () => {
  it("checkout.session.completed で purchases と projects を paid にする", async () => {
    const store = makeStore();
    const result = await handleStripeEvent(
      makeEvent("checkout.session.completed", {
        id: "cs_test_1",
        payment_status: "paid",
        amount_total: 30000,
      }),
      store
    );
    expect(result).toEqual({ handled: true, projectId: "proj-1" });
    expect(store.markPurchasePaid).toHaveBeenCalledWith("cs_test_1", 30000);
    expect(store.markProjectPaid).toHaveBeenCalledWith("proj-1");
  });

  it("対象外イベントは何もしない", async () => {
    const store = makeStore();
    const result = await handleStripeEvent(
      makeEvent("payment_intent.succeeded", { id: "cs_x" }),
      store
    );
    expect(result.handled).toBe(false);
    expect(store.markPurchasePaid).not.toHaveBeenCalled();
    expect(store.markProjectPaid).not.toHaveBeenCalled();
  });

  it("冪等：既にpaidのセッション再送では project 更新をスキップ", async () => {
    const store = makeStore({ alreadyPaid: true });
    const result = await handleStripeEvent(
      makeEvent("checkout.session.completed", {
        id: "cs_test_1",
        payment_status: "paid",
        amount_total: 30000,
      }),
      store
    );
    expect(result.handled).toBe(true);
    expect(store.markProjectPaid).not.toHaveBeenCalled();
  });

  it("未知のセッションIDは project 更新しない", async () => {
    const store = makeStore({ projectId: null });
    const result = await handleStripeEvent(
      makeEvent("checkout.session.completed", {
        id: "cs_unknown",
        payment_status: "paid",
        amount_total: 30000,
      }),
      store
    );
    expect(result).toEqual({ handled: true, projectId: null });
    expect(store.markProjectPaid).not.toHaveBeenCalled();
  });

  it("payment_status が paid でない completed は処理しない（遅延決済）", async () => {
    const store = makeStore();
    const result = await handleStripeEvent(
      makeEvent("checkout.session.completed", {
        id: "cs_unpaid",
        payment_status: "unpaid",
        amount_total: 30000,
      }),
      store
    );
    expect(result.handled).toBe(false);
    expect(store.markPurchasePaid).not.toHaveBeenCalled();
  });
});
