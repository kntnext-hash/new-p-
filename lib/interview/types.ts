import type { Industry } from "@/lib/types";

/** 質問ツリー上の1問 */
export interface Question {
  /** 質問ツリー上のキー（例："basic.name"）。answers.question_key に対応 */
  key: string;
  /** 経営者向けの平易な質問文 */
  text: string;
  /** 入力欄の下に出す補足・記入例 */
  hint?: string;
  /** M3の品質ガード（セクション1・2・7の必須質問）対象 */
  required?: boolean;
  /** 入力形式。省略時は textarea */
  input?: "text" | "textarea";
}

export interface Section {
  /** セクションID（例："basic"）。question_key の接頭辞と一致させる */
  id: string;
  title: string;
  /** セクション冒頭に表示する一言 */
  intro?: string;
  questions: Question[];
}

export interface InterviewTree {
  industry: Industry;
  sections: Section[];
}

/** answers テーブルの行のうちエンジンが使う部分 */
export interface AnswerRecord {
  question_key: string;
  question_text: string;
  answer_text: string | null;
  is_followup: boolean;
}
