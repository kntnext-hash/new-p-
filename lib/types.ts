export type Industry = "restaurant" | "retail" | "manufacturing";

export type ProjectStatus =
  | "draft"
  | "interviewing"
  | "review"
  | "paid"
  | "generated";

export interface Project {
  id: string;
  user_id: string;
  industry: Industry;
  business_name: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Answer {
  id: string;
  project_id: string;
  question_key: string;
  question_text: string;
  answer_text: string | null;
  is_followup: boolean;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  project_id: string;
  version: number;
  content_json: DocumentContent;
  pdf_path: string | null;
  created_at: string;
}

export interface Purchase {
  id: string;
  project_id: string;
  stripe_session_id: string;
  amount: number;
  status: "pending" | "paid" | "refunded";
  created_at: string;
}

/** 生成される事業概要書の構造化データ */
export interface DocumentContent {
  summary: string;
  business_overview: string;
  products: string;
  customers: string;
  suppliers: string;
  operations: string;
  assets_licenses: string;
  risks_handover: string;
  nonname_sheet: NonnameSheet;
}

/** ノンネームシート：特定可能情報をマスクした1枚 */
export interface NonnameSheet {
  industry_label: string;
  region: string;
  summary: string;
  strengths: string;
  scale: string;
  handover_notes: string;
}

export const INDUSTRY_LABELS: Record<Industry, string> = {
  restaurant: "飲食",
  retail: "小売",
  manufacturing: "小規模製造",
};

export const PRICE_JPY = 30000;
