import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTree } from "@/lib/interview/trees";
import { requiredAnswerRate, toAnswerMap } from "@/lib/interview/engine";
import {
  generateDocumentContent,
  saveDocumentVersion,
} from "@/lib/pdf/generate";
import type { AnswerRecord } from "@/lib/interview/types";
import type { Project } from "@/lib/types";

/** 品質ガード対象セクション（仕様 5.2：セクション1・2・7） */
const GUARD_SECTIONS = ["basic", "products", "risks"];
const GUARD_THRESHOLD = 0.8;

// LLM生成＋PDF化があるため余裕を持たせる（Vercel）
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let body: { projectId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.projectId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", body.projectId)
    .single<Project>();
  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: answerRows } = await supabase
    .from("answers")
    .select("question_key, question_text, answer_text, is_followup")
    .eq("project_id", project.id);
  const answers = toAnswerMap((answerRows ?? []) as AnswerRecord[]);
  const tree = getTree(project.industry);

  // 品質ガード：必須質問の回答率80%未満は生成をブロックし、不足箇所を返す
  const rate = requiredAnswerRate(tree, answers, GUARD_SECTIONS);
  if (rate < GUARD_THRESHOLD) {
    const missing = tree.sections
      .filter((s) => GUARD_SECTIONS.includes(s.id))
      .flatMap((s) =>
        s.questions
          .filter(
            (q) =>
              q.required &&
              !(answers[q.key]?.answer_text ?? "").trim()
          )
          .map((q) => ({ key: q.key, text: q.text, section: s.title }))
      );
    return NextResponse.json(
      { error: "insufficient_answers", rate, missing },
      { status: 422 }
    );
  }

  const content = await generateDocumentContent(project, tree, answers);
  if (!content) {
    return NextResponse.json({ error: "llm_failed" }, { status: 502 });
  }

  const result = await saveDocumentVersion(project, content);
  if (!result) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  await supabase
    .from("projects")
    .update({ status: "generated" })
    .eq("id", project.id);

  return NextResponse.json(result);
}
