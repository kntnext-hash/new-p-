import { z } from "zod";
import type { AnswerRecord, InterviewTree } from "./types";
import { followupKeyPrefix } from "./engine";

export const MAX_FOLLOWUPS = 3;

const responseSchema = z.object({
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        reason: z.string().optional(),
      })
    )
    .max(20), // 念のため上限。実際は MAX_FOLLOWUPS に切り詰める
});

/**
 * LLM出力をパースして質問文の配列を返す。
 * どんな形式崩れでも例外を投げず空配列（＝追加質問なしで先へ進む）。
 */
export function parseFollowupResponse(raw: string): string[] {
  try {
    // マークダウンのコードフェンスや前後の説明文が混ざっても耐える
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return [];
    const parsed = responseSchema.safeParse(
      JSON.parse(raw.slice(start, end + 1))
    );
    if (!parsed.success) return [];
    return parsed.data.questions
      .map((q) => q.text.trim())
      .filter((t) => t !== "")
      .slice(0, MAX_FOLLOWUPS);
  } catch {
    return [];
  }
}

/**
 * これまでの回答を人間可読のトランスクリプトにする。
 * 静的質問はツリー順、深掘りは各セクションの末尾。
 */
export function buildTranscript(
  tree: InterviewTree,
  answers: Record<string, AnswerRecord>
): string {
  const lines: string[] = [];
  for (const section of tree.sections) {
    lines.push(`■ ${section.title}`);
    for (const q of section.questions) {
      const a = answers[q.key];
      const text =
        a && a.answer_text && a.answer_text.trim() !== ""
          ? a.answer_text.trim()
          : "（未回答）";
      lines.push(`Q: ${q.text}`);
      lines.push(`A: ${text}`);
    }
    const prefix = followupKeyPrefix(section.id);
    const followups = Object.values(answers)
      .filter((a) => a.is_followup && a.question_key.startsWith(prefix))
      .sort((a, b) => a.question_key.localeCompare(b.question_key));
    for (const f of followups) {
      const text =
        f.answer_text && f.answer_text.trim() !== ""
          ? f.answer_text.trim()
          : "（未回答）";
      lines.push(`Q(追加): ${f.question_text}`);
      lines.push(`A: ${text}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

/**
 * 新しい深掘り質問に割り当てるキーを採番する。
 * 既存の `${sectionId}.followup.N` と衝突しない連番。
 */
export function assignFollowupKeys(
  sectionId: string,
  answers: Record<string, AnswerRecord>,
  count: number
): string[] {
  const prefix = followupKeyPrefix(sectionId);
  let max = 0;
  for (const key of Object.keys(answers)) {
    if (key.startsWith(prefix)) {
      const n = Number(key.slice(prefix.length));
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return Array.from({ length: count }, (_, i) => `${prefix}${max + 1 + i}`);
}

/** セクションに対して既に深掘りを生成済みか（回答済み・未回答問わず） */
export function hasGeneratedFollowups(
  sectionId: string,
  answers: Record<string, AnswerRecord>
): boolean {
  const prefix = followupKeyPrefix(sectionId);
  return Object.keys(answers).some((k) => k.startsWith(prefix));
}
