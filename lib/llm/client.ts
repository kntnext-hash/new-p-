import Anthropic from "@anthropic-ai/sdk";

/** 使用モデル。環境変数で差し替え可能 */
export const LLM_MODEL = process.env.LLM_MODEL ?? "claude-sonnet-5";

/**
 * Anthropic クライアント。
 * 作業ルール：全LLM呼び出しはリトライ1回＋タイムアウト30秒。
 */
export function createLLM() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 30_000,
    maxRetries: 1,
  });
}

/** レスポンスからテキスト部分を取り出す */
export function extractText(
  message: Anthropic.Message
): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}
