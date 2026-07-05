# ツグモノ

事業承継ドキュメント自動生成SaaS。AIによる構造化インタビューに答えると、事業概要書（ノンネームシート付き）がPDFで出力されます。

## 技術スタック

- Next.js 16（App Router / TypeScript / Tailwind CSS）
- Supabase（メールリンク認証 / Postgres / Storage）
- Anthropic Claude API（インタビュー深掘り・文書生成）
- Puppeteer + @sparticuz/chromium（HTML→PDF）
- Stripe Checkout + Webhook（買い切り 30,000円）
- デプロイ先：Vercel

## セットアップ

### 1. 依存関係

```bash
npm install
```

### 2. Supabase プロジェクト

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. SQL Editor で `supabase/migrations/0001_init.sql` を実行（テーブル・RLS・Storageバケットが作成される）
3. Authentication > Providers で **Email** を有効化（メールリンク＝Magic Link）
4. Authentication > URL Configuration で以下を設定：
   - Site URL: `http://localhost:3000`（本番はデプロイURL）
   - Redirect URLs: `http://localhost:3000/auth/confirm`

### 3. 環境変数

```bash
cp .env.example .env.local
```

`.env.example` の各項目を埋める：

| 変数 | 取得場所 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上（anon public key） |
| `SUPABASE_SERVICE_ROLE_KEY` | 同上（service_role key・秘匿） |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `STRIPE_SECRET_KEY` | Stripe ダッシュボード（テストモード） |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen` 実行時に表示 |
| `STRIPE_PRICE_ID` | Stripe で 30,000円（JPY・一回払い）の Price を作成 |
| `NEXT_PUBLIC_APP_URL` | ローカルは `http://localhost:3000` |

### 4. 起動

```bash
npm run dev
```

http://localhost:3000 を開く。

### 5. Stripe Webhook（ローカル開発時）

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## テスト

```bash
npm run test        # ユニットテスト（Vitest）
npm run test:e2e    # E2E（Playwright）
npm run build       # 本番ビルド確認
```

## ディレクトリ構成（主要）

```
app/                  ページ・ルートハンドラ
lib/supabase/         Supabaseクライアント（browser / server / admin）
lib/interview/        質問ツリー・深掘りプロンプト
lib/pdf/              PDFテンプレート・生成
supabase/migrations/  DBスキーマ（SQL）
```

## 進捗

マイルストーンごとの受け入れ条件の確認結果は [PROGRESS.md](PROGRESS.md) を参照。
スコープ判断の記録は [SCOPE_QUESTIONS.md](SCOPE_QUESTIONS.md) を参照。
