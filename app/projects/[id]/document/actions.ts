"use server";

import { createClient } from "@/lib/supabase/server";
import { validateDocumentContent } from "@/lib/pdf/content";
import {
  renderAndStorePdf,
  saveDocumentVersion,
  type SaveResult,
} from "@/lib/pdf/generate";
import { isPaid } from "@/lib/payment";
import type { DocumentRow, Project } from "@/lib/types";

/**
 * フォームで修正された content_json を新バージョンとして保存し再PDF化する。
 * 未決済でも内容修正は可能だが、PDFは作らない（透かしプレビューに反映されるのみ）。
 */
export async function regenerateDocument(
  projectId: string,
  contentInput: unknown
): Promise<{ ok: true; result: SaveResult } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single<Project>();
  if (!project) return { ok: false, error: "not_found" };

  const content = validateDocumentContent(contentInput);
  if (!content) return { ok: false, error: "invalid_content" };

  const result = await saveDocumentVersion(project, content, {
    renderPdf: isPaid(project.status),
  });
  if (!result) return { ok: false, error: "save_failed" };

  return { ok: true, result };
}

/**
 * 決済後、PDFが未作成のバージョンをPDF化する（決済直後の解禁処理）。
 */
export async function ensurePdf(
  projectId: string,
  documentId: string
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single<Project>();
  if (!project || !isPaid(project.status)) return { ok: false };

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("project_id", projectId)
    .single<DocumentRow>();
  if (!doc) return { ok: false };
  if (doc.pdf_path) return { ok: true };

  const ok = await renderAndStorePdf(
    project,
    doc.content_json,
    doc.version,
    doc.id
  );
  if (ok) {
    await supabase
      .from("projects")
      .update({ status: "generated" })
      .eq("id", projectId);
  }
  return { ok };
}
