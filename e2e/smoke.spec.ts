import { expect, test } from "@playwright/test";

const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

test.describe("スモーク", () => {
  test.skip(!hasSupabase, "Supabase未設定のためスキップ");

  test("LPが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toContainText("質問に答えるだけ");
    await expect(page.getByText("料金")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "無料で質問に答えてみる" })
    ).toBeVisible();
  });

  test("未ログインで /projects に行くと /login に飛ばされる", async ({
    page,
  }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("ログイン / 新規登録")).toBeVisible();
  });
});
