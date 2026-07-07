# PROGRESS

マイルストーンごとの受け入れ条件（AC）の確認記録。

---

## M0: 足場（2026-07-05）

**実装内容**
- Next.js 16.2（App Router / TypeScript / Tailwind v4）スキャフォールド
- Supabase クライアント3種（browser / server / admin）＋ proxy.ts でのセッションリフレッシュ・`/projects` 配下の認証ガード
- メールリンク認証（`/login` → `signInWithOtp` → `/auth/confirm` で token_hash / PKCE code の両方式に対応）
- スキーマ migration（`supabase/migrations/0001_init.sql`）：projects / answers / documents / purchases、全テーブルRLS（本人のみ）、documents・purchases の書き込みは service role のみ、Storage非公開バケット `documents`
- プロジェクト作成（業種選択＋屋号）・一覧表示・詳細ページ

**AC確認**
- `npm run build` 警告なしで通過 ✅
- サインアップ→プロジェクト作成→一覧表示：コードパスは実装済み。実行確認は Supabase プロジェクト（URL / anon key）の接続待ち ⏳
  - 接続後の確認手順：README のセットアップ 2〜4 を実施 → `/login` からメールリンクでログイン → 「新しく作る」→ 一覧に表示されること

## M1: 静的質問ツリー（2026-07-05）

**実装内容**
- 3業種の質問ツリー（`lib/interview/trees/`）：飲食31問・小売35問・製造35問、各7セクション、平易な日本語＋記入例ヒント。セクション1・2・7に required 質問（M3品質ガード用）
- ツリー走査エンジン（`lib/interview/engine.ts`）：再開位置・遷移・進捗・深掘りキー規約・必須回答率を純関数で実装
- 1問1画面UI（`interview-client.tsx`）：進捗バー（セクション/全体）、「わからない／後で」スキップ、入力中1.5秒デバウンス自動保存、セクション末サマリー（インライン編集可）
- 回答は `answers` に upsert（project_id + question_key 一意）。スキップは answer_text=null で記録し再開時に再提示しない
- 完了時に projects.status を review へ。プロジェクト詳細に進捗・再開導線

**AC確認**
- ユニットテスト32件パス（ツリー構造検証＋遷移・再開・進捗・必須回答率）✅
- `npm run build` 警告なし ✅
- 飲食テンプレで最後まで回答→リロードで回答保持：コードパス実装済み（自動保存＋upsert＋再開位置計算）。ブラウザでの実地確認は Supabase 接続待ち ⏳

## M2: 動的深掘り（2026-07-05）

**実装内容**
- LLMクライアント（`lib/llm/client.ts`）：リトライ1回＋タイムアウト30秒（作業ルール準拠）。モデルは `LLM_MODEL` 環境変数で差し替え可（既定 claude-sonnet-5）
- プロンプト分離（`lib/interview/prompts/followups.ts`）：矛盾検出＋重要な空白の検出、最大3問、平易な日本語、JSON形式指定
- パーサ（`lib/interview/followups.ts`）：コードフェンス混入・壊れたJSONでも例外を出さず空配列 → ユーザーを止めない。3問に切り詰め。深掘りキーの採番（`{section}.followup.N`）と再生成防止
- APIルート（`/api/interview/followups`）：認証・所有権（RLS）確認 → 生成済みなら未回答分を返すだけ → LLM呼び出し → is_followup=true で answers に保存
- インタビューUIは失敗時（非200・例外・空配列）に無言で次セクションへ進む

**AC確認**
- ユニットテスト41件パス（パース異常系・切り詰め・採番・トランスクリプト構築を含む）✅
- API失敗時もフローが止まらない：クライアント側 try/catch＋API側は常に200+空配列 ✅（コード＋テストで担保）
- 矛盾セットで追加質問が生成される：`scripts/verify-followups.ts` を用意。ANTHROPIC_API_KEY 設定後に `npx tsx --env-file=.env.local scripts/verify-followups.ts` で確認 ⏳

## M3: 文書生成＋PDF（2026-07-07）

**実装内容**
- 生成プロンプト（`lib/interview/prompts/document.ts`）：事実ベース・誇張なし・未回答は「情報なし」明記・ノンネームの特定情報マスク規則を明文化
- content_json スキーマ検証（`lib/pdf/content.ts`、zod）。パース失敗は null → UIで再試行誘導
- HTMLテンプレート（`lib/pdf/templates/overview.tsx` → renderToString）：本編（概要＋7セクション）＋別ページのノンネームシート。Noto Sans JP Webフォント
- Puppeteer レンダラ（`lib/pdf/render.ts`）：Vercel(Linux)は @sparticuz/chromium、ローカルはインストール済みChrome/Edgeを自動探索。`document.fonts.ready` 待ちでフォント崩れ防止
- `/api/documents/generate`：品質ガード（セクション1・2・7の必須質問80%未満は422＋不足リスト返却→UIが回答画面へ誘導）→ LLM生成 → documents に版管理で保存 → Storage にPDF
- PDF失敗時のフォールバック：content は保存し pdfFailed を返す（「保存して再PDF化」で復旧可能）
- `/api/documents/[docId]/download`：所有権確認→署名付きURL（60秒）
- 編集ページ（`/projects/[id]/document`）：全フィールドをフォーム修正→新バージョンとして再PDF化

**AC確認**
- ユニットテスト48件パス（contentパース異常系・テンプレートに「情報なし」表記・ノンネーム部に屋号が含まれない）✅
- フル回答セット（未回答2問含む）→ A4縦PDF生成をローカルChromeで実地確認（`scripts/verify-document.ts --fixture`、2ページ・406KB）。未回答項目は「情報なし」表記、ノンネームシートに固有名詞なしを目視確認 ✅
- LLM生成込みのE2E確認は ANTHROPIC_API_KEY 設定後に `npx tsx --env-file=.env.local scripts/verify-document.ts` ⏳
- `npm run build` 警告なし ✅

## M4: Stripe課金（2026-07-07）

**実装内容**
- `/api/stripe/checkout`：Checkout Session（STRIPE_PRICE_ID・一回払い・metadata に project_id）を作成し、purchases に pending 行を挿入（service role。ユーザーには書き込み権限なし）
- `/api/stripe/webhook`：署名検証（生ボディ＋STRIPE_WEBHOOK_SECRET）→ `handleStripeEvent`。冪等性は stripe_session_id 一意＋「既に paid ならスキップ」で担保。処理失敗は500でStripeの再送に任せる
- Webhookロジックは `lib/stripe/webhook.ts` に分離し、ストアを注入可能に（ユニットテスト対象）
- 生成ゲート：未決済は content_json のみ生成・保存（PDFは作らない）→ 文書ページは概要1セクションの透かしプレビュー＋購入導線のみ。決済後は全文編集・PDF作成・DL解禁
- ダウンロードAPIにも 402 ガード（多層防御）。決済遷移バナー（success/cancel）表示

**AC確認**
- ユニットテスト53件パス（Webhook: completed処理・対象外イベント無視・再送冪等・未知セッション・遅延決済未入金の5ケース）✅
- 未決済では透かしプレビューのみ／決済→paid遷移→PDF解禁：コードパス実装済み。テストモード実地確認は Stripe キー設定＋`stripe listen` で実施 ⏳
  - 確認手順：`.env.local` に STRIPE_* を設定 → `stripe listen --forward-to localhost:3000/api/stripe/webhook` → テストカード 4242… で決済 → projects.status が paid になり全文＋PDFが解禁されること

## M5: 仕上げ（2026-07-07）

**実装内容**
- LP（`app/page.tsx`）：課題→使い方3ステップ＋画面イメージ→価格（30,000円買い切り）→FAQ→CTA。デモGIFは実環境接続後に差し替え（SCOPE_QUESTIONS #3）
- エラーハンドリング：`app/error.tsx`（グローバル）、`app/not-found.tsx`、`/projects` 系の `loading.tsx`（スケルトン）。各フォーム・API呼び出しは実装時からエラー文言・リトライ誘導済み
- Playwright E2E：
  - `e2e/smoke.spec.ts`：LP表示・未ログインリダイレクト
  - `e2e/full-flow.spec.ts`：登録（Admin APIでマジックリンク発行）→ プロジェクト作成 → 全問回答（深掘り込み）→ 生成 → 未決済は透かしプレビュー＋DL 402 → paid遷移 → 全文解禁 → PDF作成 → DL 200/PDF
  - Supabase / ANTHROPIC_API_KEY 未設定時は全テストを明示スキップ（webServerも起動しない）
- ESLint 0 warnings / README整備

**AC確認**
- `npm run build` 警告なしで通過 ✅
- ユニットテスト53件パス・ESLintクリーン ✅
- 主要フローE2E：テストコード完備。実行は Supabase＋ANTHROPIC_API_KEY 設定後に `npm run test:e2e` ⏳

---

## 残作業（キー設定後の確認チェックリスト）

1. `.env.example` を `.env.local` にコピーして各キーを設定
2. Supabase SQL Editor で `supabase/migrations/0001_init.sql` を実行、Email認証とRedirect URLを設定（README参照）
3. `npx tsx --env-file=.env.local scripts/verify-followups.ts` — M2 AC
4. `npx tsx --env-file=.env.local scripts/verify-document.ts` — M3 AC（LLM込み）
5. `npm run test:e2e` — M1/M3/M4/M5 AC（登録→回答→決済→PDF）
6. Stripeテストモードの実決済確認（M4手順）
7. Vercelデプロイ（環境変数を設定、`STRIPE_WEBHOOK_SECRET` は本番Webhookエンドポイントのものに差し替え）
