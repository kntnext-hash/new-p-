/**
 * M2 AC検証スクリプト：矛盾を含むテスト回答セットで追加質問が生成されるか。
 *
 * 実行: ANTHROPIC_API_KEY を .env.local に設定のうえ
 *   npx tsx --env-file=.env.local scripts/verify-followups.ts
 */
import { createLLM, extractText, LLM_MODEL } from "../lib/llm/client";
import { parseFollowupResponse, buildTranscript } from "../lib/interview/followups";
import {
  buildFollowupUserPrompt,
  FOLLOWUP_SYSTEM_PROMPT,
} from "../lib/interview/prompts/followups";
import { restaurantTree } from "../lib/interview/trees/restaurant";
import { toAnswerMap } from "../lib/interview/engine";
import type { AnswerRecord } from "../lib/interview/types";

// 矛盾を含むテスト回答セット：
// - 従業員は「私1人だけ」なのに operations.shifts で「シフト表を毎月作る」
// - operations.keyperson が未回答（重要な空白）
const contradictoryAnswers: AnswerRecord[] = [
  { question_key: "basic.name", question_text: "屋号", answer_text: "やまだ食堂", is_followup: false },
  { question_key: "basic.location", question_text: "所在地", answer_text: "名古屋市中区の商店街", is_followup: false },
  { question_key: "basic.founded", question_text: "創業", answer_text: "昭和60年", is_followup: false },
  { question_key: "basic.entity", question_text: "形態", answer_text: "個人事業", is_followup: false },
  { question_key: "basic.staff", question_text: "従業員数", answer_text: "私1人だけでやっています", is_followup: false },
  { question_key: "operations.hours", question_text: "営業時間", answer_text: "11時〜21時、年中無休", is_followup: false },
  { question_key: "operations.daily", question_text: "1日の流れ", answer_text: "朝仕込み、昼夜営業", is_followup: false },
  { question_key: "operations.keyperson", question_text: "キーパーソン", answer_text: null, is_followup: false },
  { question_key: "operations.recipes", question_text: "レシピ文書化", answer_text: "全部頭の中", is_followup: false },
  { question_key: "operations.shifts", question_text: "勤務の決め方", answer_text: "パートさんのシフト表を毎月作っています", is_followup: false },
];

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY が未設定です。");
    process.exit(1);
  }

  const answers = toAnswerMap(contradictoryAnswers);
  const section = restaurantTree.sections.find((s) => s.id === "operations")!;

  console.log(`モデル: ${LLM_MODEL}`);
  console.log("矛盾セット: 従業員1人 vs パートのシフト表 / キーパーソン未回答\n");

  const llm = createLLM();
  const message = await llm.messages.create({
    model: LLM_MODEL,
    max_tokens: 1024,
    system: FOLLOWUP_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildFollowupUserPrompt({
          industryLabel: "飲食",
          businessName: "やまだ食堂",
          currentSectionTitle: section.title,
          transcript: buildTranscript(restaurantTree, answers),
        }),
      },
    ],
  });

  const raw = extractText(message);
  console.log("--- LLM生出力 ---\n" + raw + "\n-----------------\n");

  const questions = parseFollowupResponse(raw);
  console.log(`パース結果: ${questions.length}問`);
  questions.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));

  if (questions.length >= 1 && questions.length <= 3) {
    console.log("\n✅ AC満足: 追加質問が1〜3問生成された");
  } else {
    console.log("\n❌ AC不満足: 追加質問が生成されなかった");
    process.exit(1);
  }
}

main();
