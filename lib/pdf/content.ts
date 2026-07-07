import { z } from "zod";
import type { DocumentContent } from "@/lib/types";

const nonnameSchema = z.object({
  industry_label: z.string(),
  region: z.string(),
  summary: z.string(),
  strengths: z.string(),
  scale: z.string(),
  handover_notes: z.string(),
});

export const documentContentSchema = z.object({
  summary: z.string(),
  business_overview: z.string(),
  products: z.string(),
  customers: z.string(),
  suppliers: z.string(),
  operations: z.string(),
  assets_licenses: z.string(),
  risks_handover: z.string(),
  nonname_sheet: nonnameSchema,
});

/**
 * LLM出力を DocumentContent にパースする。
 * 失敗時は null（呼び出し側でエラー表示・再試行に誘導する）。
 */
export function parseDocumentResponse(raw: string): DocumentContent | null {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    const parsed = documentContentSchema.safeParse(
      JSON.parse(raw.slice(start, end + 1))
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** フォーム編集後の content_json 検証（再PDF化時に使用） */
export function validateDocumentContent(
  value: unknown
): DocumentContent | null {
  const parsed = documentContentSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
