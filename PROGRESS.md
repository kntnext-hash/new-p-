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
