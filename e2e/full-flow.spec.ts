import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * 主要フローE2E：登録 → 回答 → 決済 → PDF
 *
 * 必要な環境変数（.env.local）：
 * - NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
 * - ANTHROPIC_API_KEY（深掘り・文書生成）
 *
 * 決済はStripeのホストページ自動操作が不安定なため、Webhook相当の状態遷移
 * （projects.status='paid'）をservice roleで直接行う。Webhook処理自体は
 * lib/stripe/__tests__/webhook.test.ts で単体検証済み。
 */

const env = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
};
const ready = !!env.url && !!env.serviceKey && !!env.anthropic;

function admin() {
  return createClient(env.url!, env.serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** 質問画面が続く限り回答し続ける（深掘り・サマリーにも対応） */
async function answerAllQuestions(page: Page) {
  for (let guard = 0; guard < 200; guard++) {
    // 完了画面
    if (
      await page
        .getByText("すべての質問にお答えいただきました")
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }
    // セクションサマリー
    const summaryButton = page.getByRole("button", {
      name: "この内容で次へ進む",
    });
    if (await summaryButton.isVisible().catch(() => false)) {
      await summaryButton.click();
      // 深掘り生成（LLM呼び出し）を待つ
      await page.waitForTimeout(500);
      continue;
    }
    // 通常質問・深掘り質問
    const nextButton = page.getByRole("button", { name: /次へ|保存中/ });
    if (await nextButton.isVisible().catch(() => false)) {
      const box = page.locator("textarea, input[type=text]").first();
      await box.fill("テスト回答です。従業員は私と妻の2人でやっています。");
      await nextButton.click();
      continue;
    }
    await page.waitForTimeout(500);
  }
  throw new Error("インタビューが200ステップで終わらなかった");
}

test.describe("主要フロー", () => {
  test.skip(!ready, "Supabase / ANTHROPIC_API_KEY 未設定のためスキップ");

  let email: string;
  let userId: string;

  test.afterAll(async () => {
    if (userId) await admin().auth.admin.deleteUser(userId);
  });

  test("登録→回答→決済→PDFダウンロード", async ({ page }) => {
    // --- 登録（メールリンク相当をAdmin APIで発行） ---
    email = `e2e-${Date.now()}@example.com`;
    const client = admin();
    const { data: created, error: createError } =
      await client.auth.admin.createUser({ email, email_confirm: true });
    expect(createError).toBeNull();
    userId = created.user!.id;

    const { data: link, error: linkError } =
      await client.auth.admin.generateLink({ type: "magiclink", email });
    expect(linkError).toBeNull();
    const tokenHash = link.properties!.hashed_token;

    await page.goto(
      `/auth/confirm?token_hash=${tokenHash}&type=magiclink&next=/projects`
    );
    await expect(page).toHaveURL(/\/projects/);

    // --- プロジェクト作成 ---
    await page.getByRole("link", { name: /新しく作る|始める/ }).first().click();
    await expect(page).toHaveURL(/\/projects\/new/);
    await page.getByText("飲食", { exact: true }).click();
    await page
      .getByPlaceholder("例：やまだ食堂")
      .fill("E2Eテスト食堂");
    await page.getByRole("button", { name: "登録して進む" }).click();
    await expect(page.getByText("ステップ1：質問に答える")).toBeVisible();
    const projectUrl = page.url();
    const projectId = projectUrl.split("/").pop()!;

    // --- インタビュー（全問回答。深掘り含む） ---
    await page.getByRole("link", { name: "始める" }).click();
    await answerAllQuestions(page);
    await page.getByRole("link", { name: "事業のページへ戻る" }).click();
    await expect(page.getByText("✓ 完了")).toBeVisible();

    // --- 概要書生成（未決済 → 透かしプレビューのみ） ---
    await page.getByRole("button", { name: "概要書を作成する" }).click();
    await expect(page).toHaveURL(/\/document/, { timeout: 180_000 });
    await expect(page.getByText("事業の概要（プレビュー）")).toBeVisible();
    await expect(page.getByText("購入して全文を見る")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "PDFをダウンロード" })
    ).toHaveCount(0);

    // 未決済でのPDFダウンロードは 402
    const { data: docRow } = await client
      .from("documents")
      .select("id")
      .eq("project_id", projectId)
      .single();
    const blocked = await page.request.get(
      `/api/documents/${docRow!.id}/download`
    );
    expect(blocked.status()).toBe(402);

    // --- 決済（Webhook相当の遷移をservice roleで実施） ---
    await client
      .from("projects")
      .update({ status: "paid" })
      .eq("id", projectId);
    await page.reload();

    // --- 全文解禁 → PDF作成 → ダウンロード ---
    await expect(page.getByText("1. 事業基本情報")).toBeVisible();
    await page.getByRole("button", { name: "PDFを作成する" }).click();
    await expect(
      page.getByRole("link", { name: "PDFをダウンロード" })
    ).toBeVisible({ timeout: 120_000 });

    const res = await page.request.get(
      `/api/documents/${docRow!.id}/download`
    );
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("pdf");
  });
});
