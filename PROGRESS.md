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
