import { createAdminClient } from "@/lib/supabase/admin";
import { createLLM, extractText, LLM_MODEL } from "@/lib/llm/client";
import { buildTranscript } from "@/lib/interview/followups";
import {
  buildDocumentUserPrompt,
  DOCUMENT_SYSTEM_PROMPT,
} from "@/lib/interview/prompts/document";
import type { AnswerRecord, InterviewTree } from "@/lib/interview/types";
import { INDUSTRY_LABELS, type DocumentContent, type Project } from "@/lib/types";
import { parseDocumentResponse } from "./content";
import { htmlToPdf, renderOverviewHtml } from "./render";

/**
 * 全回答から content_json を生成する。
 * 失敗時は null（呼び出し側でエラー表示・再試行に誘導）。
 */
export async function generateDocumentContent(
  project: Project,
  tree: InterviewTree,
  answers: Record<string, AnswerRecord>
): Promise<DocumentContent | null> {
  try {
    const llm = createLLM();
    const message = await llm.messages.create({
      model: LLM_MODEL,
      max_tokens: 4096,
      system: DOCUMENT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildDocumentUserPrompt({
            industryLabel: INDUSTRY_LABELS[project.industry],
            businessName: project.business_name,
            transcript: buildTranscript(tree, answers),
          }),
        },
      ],
    });
    return parseDocumentResponse(extractText(message));
  } catch {
    return null;
  }
}

export interface SaveResult {
  documentId: string;
  version: number;
  /** PDF化を試みて失敗した場合 true（content は保存済み。再PDF化で復旧可能） */
  pdfFailed: boolean;
  /** PDFがStorageに存在するか */
  hasPdf: boolean;
}

/**
 * 指定バージョンの content をPDF化して Storage に置き、pdf_path を更新する。
 * 成功で true。
 */
export async function renderAndStorePdf(
  project: Project,
  content: DocumentContent,
  version: number,
  documentId: string
): Promise<boolean> {
  const admin = createAdminClient();
  try {
    const html = await renderOverviewHtml({
      businessName: project.business_name,
      industryLabel: INDUSTRY_LABELS[project.industry],
      content,
      version,
      generatedAt: new Date().toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });
    const pdf = await htmlToPdf(html);
    const path = `${project.id}/v${version}.pdf`;
    const { error: uploadError } = await admin.storage
      .from("documents")
      .upload(path, pdf, { contentType: "application/pdf", upsert: true });
    if (uploadError) return false;
    await admin
      .from("documents")
      .update({ pdf_path: path })
      .eq("id", documentId);
    return true;
  } catch {
    return false;
  }
}

/**
 * content_json を新しいバージョンとして保存する。
 * renderPdf=true のときのみPDF化（未決済プレビュー段階では作らない）。
 * PDF化に失敗しても content は保存し、pdfFailed で知らせる（フォールバック）。
 */
export async function saveDocumentVersion(
  project: Project,
  content: DocumentContent,
  options: { renderPdf: boolean }
): Promise<SaveResult | null> {
  const admin = createAdminClient();

  const { data: latest } = await admin
    .from("documents")
    .select("version")
    .eq("project_id", project.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (latest?.version ?? 0) + 1;

  const { data: doc, error: insertError } = await admin
    .from("documents")
    .insert({ project_id: project.id, version, content_json: content })
    .select("id")
    .single();
  if (insertError || !doc) return null;

  if (!options.renderPdf) {
    return { documentId: doc.id, version, pdfFailed: false, hasPdf: false };
  }

  const ok = await renderAndStorePdf(project, content, version, doc.id);
  return { documentId: doc.id, version, pdfFailed: !ok, hasPdf: ok };
}
