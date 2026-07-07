import { defineConfig } from "@playwright/test";

// .env.local があれば読み込む（Node 21+ の標準機能）
try {
  process.loadEnvFile(".env.local");
} catch {
  // 未設定でも起動はできる（各テスト側で skip 判定する）
}

const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default defineConfig({
  testDir: "e2e",
  timeout: 300_000, // LLM生成・PDF化を含むため長め
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:3000",
  },
  // Supabase未設定ではアプリ自体が起動できないため、webServerも立てない
  // （各テストは skip 判定により全件スキップされる）
  ...(hasSupabase
    ? {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 90_000,
        },
      }
    : {}),
});
