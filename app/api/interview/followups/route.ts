import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createLLM, extractText, LLM_MODEL } from "@/lib/llm/client";
import { getTree } from "@/lib/interview/trees";
import { pendingFollowups, toAnswerMap } from "@/lib/interview/engine";
import {
  assignFollowupKeys,
  buildTranscript,
  hasGeneratedFollowups,
  parseFollowupResponse,
} from "@/lib/interview/followups";
import {
  buildFollowupUserPrompt,
  FOLLOWUP_SYSTEM_PROMPT,
} from "@/lib/interview/prompts/followups";
import type { AnswerRecord } from "@/lib/interview/types";
import { INDUSTRY_LABELS, type Project } from "@/lib/types";

/**
 * セクション末の深掘り質問生成。
 * 方針：どんな失敗でも 200 + 空配列を返し、ユーザーのフローを止めない。
 */
export async function POST(request: NextRequest) {
  const empty = NextResponse.json({ followups: [] });

  let body: { projectId?: string; sectionId?: string };
  try {
    body = await request.json();
  } catch {
    return empty;
  }
  const { projectId, sectionId } = body;
  if (!projectId || !sectionId) return empty;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ followups: [] }, { status: 401 });

  // RLSにより本人のプロジェクトのみ取得できる
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single<Project>();
  if (!project) return empty;

  const tree = getTree(project.industry);
  const section = tree.sections.find((s) => s.id === sectionId);
  if (!section) return empty;

  const { data: answerRows } = await supabase
    .from("answers")
    .select("question_key, question_text, answer_text, is_followup")
    .eq("project_id", projectId);
  const answers = toAnswerMap((answerRows ?? []) as AnswerRecord[]);

  // 既に生成済みなら再生成しない（未回答の深掘りが残っていればそれを返す）
  if (hasGeneratedFollowups(sectionId, answers)) {
    return NextResponse.json({
      followups: pendingFollowups(sectionId, answers),
    });
  }

  // LLM呼び出し（client.ts 側でリトライ1回＋タイムアウト30秒）
  let questionTexts: string[];
  try {
    const llm = createLLM();
    const message = await llm.messages.create({
      model: LLM_MODEL,
      max_tokens: 1024,
      system: FOLLOWUP_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildFollowupUserPrompt({
            industryLabel: INDUSTRY_LABELS[project.industry],
            businessName: project.business_name,
            currentSectionTitle: section.title,
            transcript: buildTranscript(tree, answers),
          }),
        },
      ],
    });
    questionTexts = parseFollowupResponse(extractText(message));
  } catch {
    return empty;
  }

  if (questionTexts.length === 0) return empty;

  const keys = assignFollowupKeys(sectionId, answers, questionTexts.length);
  const rows = questionTexts.map((text, i) => ({
    project_id: projectId,
    question_key: keys[i],
    question_text: text,
    answer_text: null,
    is_followup: true,
  }));

  const { error } = await supabase.from("answers").insert(rows);
  if (error) return empty;

  const followups: AnswerRecord[] = rows.map((r) => ({
    question_key: r.question_key,
    question_text: r.question_text,
    answer_text: null,
    is_followup: true,
  }));
  return NextResponse.json({ followups });
}
