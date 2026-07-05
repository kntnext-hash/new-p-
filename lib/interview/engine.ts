import type { AnswerRecord, InterviewTree, Question, Section } from "./types";

/** answers 行の配列を question_key 引きのマップにする */
export function toAnswerMap(
  answers: AnswerRecord[]
): Record<string, AnswerRecord> {
  const map: Record<string, AnswerRecord> = {};
  for (const a of answers) map[a.question_key] = a;
  return map;
}

/** 記録がある（回答済み or スキップ済み）か */
export function isVisited(
  key: string,
  answers: Record<string, AnswerRecord>
): boolean {
  return key in answers;
}

/** 空でない回答があるか */
export function isAnswered(
  key: string,
  answers: Record<string, AnswerRecord>
): boolean {
  const a = answers[key];
  return !!a && !!a.answer_text && a.answer_text.trim() !== "";
}

/** ツリー内の全質問数 */
export function totalQuestions(tree: InterviewTree): number {
  return tree.sections.reduce((n, s) => n + s.questions.length, 0);
}

/** セクション内で記録済みの質問数 */
export function sectionVisitedCount(
  section: Section,
  answers: Record<string, AnswerRecord>
): number {
  return section.questions.filter((q) => isVisited(q.key, answers)).length;
}

/** ツリー全体で記録済みの質問数 */
export function totalVisitedCount(
  tree: InterviewTree,
  answers: Record<string, AnswerRecord>
): number {
  return tree.sections.reduce(
    (n, s) => n + sectionVisitedCount(s, answers),
    0
  );
}

export interface Position {
  sectionIndex: number;
  questionIndex: number;
}

/**
 * 再開位置：最初の未記録質問。
 * 全問記録済みなら null（＝サマリー／完了へ）。
 */
export function firstUnvisitedPosition(
  tree: InterviewTree,
  answers: Record<string, AnswerRecord>
): Position | null {
  for (let s = 0; s < tree.sections.length; s++) {
    const section = tree.sections[s];
    for (let q = 0; q < section.questions.length; q++) {
      if (!isVisited(section.questions[q].key, answers)) {
        return { sectionIndex: s, questionIndex: q };
      }
    }
  }
  return null;
}

/** 次の質問位置。セクション末なら null（＝サマリー表示へ） */
export function nextPosition(
  tree: InterviewTree,
  pos: Position
): Position | null {
  const section = tree.sections[pos.sectionIndex];
  if (pos.questionIndex + 1 < section.questions.length) {
    return { sectionIndex: pos.sectionIndex, questionIndex: pos.questionIndex + 1 };
  }
  return null;
}

/** 次のセクションの先頭位置。最終セクションなら null（＝インタビュー完了） */
export function nextSectionStart(
  tree: InterviewTree,
  sectionIndex: number
): Position | null {
  if (sectionIndex + 1 < tree.sections.length) {
    return { sectionIndex: sectionIndex + 1, questionIndex: 0 };
  }
  return null;
}

export function getQuestion(tree: InterviewTree, pos: Position): Question {
  return tree.sections[pos.sectionIndex].questions[pos.questionIndex];
}

/**
 * 深掘り質問（M2）のキー接頭辞。
 * セクション sectionId の深掘りは `${sectionId}.followup.N` で保存する。
 */
export function followupKeyPrefix(sectionId: string): string {
  return `${sectionId}.followup.`;
}

/** 指定セクションの未回答の深掘り質問（回答画面に差し込む用） */
export function pendingFollowups(
  sectionId: string,
  answers: Record<string, AnswerRecord>
): AnswerRecord[] {
  const prefix = followupKeyPrefix(sectionId);
  return Object.values(answers)
    .filter(
      (a) =>
        a.is_followup &&
        a.question_key.startsWith(prefix) &&
        (a.answer_text === null || a.answer_text.trim() === "")
    )
    .sort((a, b) => a.question_key.localeCompare(b.question_key));
}

/**
 * 必須質問の回答率（M3 品質ガード用）。
 * 対象セクションの required:true の質問のうち、空でない回答がある割合。
 */
export function requiredAnswerRate(
  tree: InterviewTree,
  answers: Record<string, AnswerRecord>,
  sectionIds: string[]
): number {
  const required: Question[] = tree.sections
    .filter((s) => sectionIds.includes(s.id))
    .flatMap((s) => s.questions.filter((q) => q.required));
  if (required.length === 0) return 1;
  const answered = required.filter((q) => isAnswered(q.key, answers)).length;
  return answered / required.length;
}
