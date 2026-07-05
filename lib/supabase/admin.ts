import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service Role クライアント（RLSをバイパスする）。
 * Stripe Webhook や PDF 保存などサーバー専用処理でのみ使用すること。
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
