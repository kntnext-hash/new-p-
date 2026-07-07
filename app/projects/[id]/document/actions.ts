"use server";

import { createClient } from "@/lib/supabase/server";
import { validateDocumentContent } from "@/lib/pdf/content";
import { saveDocumentVersion, type SaveResult } from "@/lib/pdf/generate";
import type { Project } from "@/lib/types";

/**
 * フォームで修正された content_json を新バージョンとして保存し再PDF化する。
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

  const result = await saveDocumentVersion(project, content);
  if (!result) return { ok: false, error: "save_failed" };

  return { ok: true, result };
}
