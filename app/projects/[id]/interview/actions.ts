"use server";

import { createClient } from "@/lib/supabase/server";

interface SaveAnswerInput {
  projectId: string;
  questionKey: string;
  questionText: string;
  answerText: string | null;
  isFollowup: boolean;
}

/**
 * 回答を保存（同一質問キーは上書き）。
 * 初回保存時にプロジェクトを interviewing に進める。
 */
export async function saveAnswer(
  input: SaveAnswerInput
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // RLSにより他人のプロジェクトへの書き込みは弾かれる
  const { error } = await supabase.from("answers").upsert(
    {
      project_id: input.projectId,
      question_key: input.questionKey,
      question_text: input.questionText,
      answer_text: input.answerText,
      is_followup: input.isFollowup,
    },
    { onConflict: "project_id,question_key" }
  );
  if (error) return { ok: false };

  // draft → interviewing（それ以外の状態は触らない）
  await supabase
    .from("projects")
    .update({ status: "interviewing" })
    .eq("id", input.projectId)
    .eq("status", "draft");

  return { ok: true };
}

/** インタビュー完了：review 状態へ進める */
export async function completeInterview(
  projectId: string
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("projects")
    .update({ status: "review" })
    .eq("id", projectId)
    .in("status", ["draft", "interviewing"]);

  return { ok: !error };
}
