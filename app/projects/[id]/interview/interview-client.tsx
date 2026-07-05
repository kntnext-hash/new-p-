"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  firstUnvisitedPosition,
  getQuestion,
  nextPosition,
  nextSectionStart,
  toAnswerMap,
  totalQuestions,
  totalVisitedCount,
  type Position,
} from "@/lib/interview/engine";
import type { AnswerRecord, InterviewTree } from "@/lib/interview/types";
import { completeInterview, saveAnswer } from "./actions";

type View =
  | { mode: "question"; pos: Position }
  | { mode: "summary"; sectionIndex: number }
  | { mode: "followup"; sectionIndex: number; index: number }
  | { mode: "done" };

interface Props {
  projectId: string;
  businessName: string;
  tree: InterviewTree;
  initialAnswers: AnswerRecord[];
}

/**
 * セクション末に深掘り質問の生成を依頼する（M2で実装するAPI）。
 * どんな失敗でも空配列を返し、ユーザーのフローを止めない。
 */
async function requestFollowups(
  projectId: string,
  sectionId: string
): Promise<AnswerRecord[]> {
  try {
    const res = await fetch("/api/interview/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, sectionId }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { followups?: AnswerRecord[] };
    return data.followups ?? [];
  } catch {
    return [];
  }
}

export default function InterviewClient({
  projectId,
  businessName,
  tree,
  initialAnswers,
}: Props) {
  const [answers, setAnswers] = useState(() => toAnswerMap(initialAnswers));
  const [view, setView] = useState<View>(() => {
    const pos = firstUnvisitedPosition(tree, toAnswerMap(initialAnswers));
    return pos ? { mode: "question", pos } : { mode: "done" };
  });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [followupQuestions, setFollowupQuestions] = useState<AnswerRecord[]>(
    []
  );
  const [generatingFollowups, setGeneratingFollowups] = useState(false);
  // サマリー編集用：question_key → 編集中テキスト
  const [summaryDrafts, setSummaryDrafts] = useState<Record<string, string>>(
    {}
  );
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = totalQuestions(tree);
  const visited = totalVisitedCount(tree, answers);
  const progressPercent = Math.round((visited / total) * 100);

  /** 保存して local state を更新する */
  const persist = useCallback(
    async (
      questionKey: string,
      questionText: string,
      answerText: string | null,
      isFollowup: boolean
    ) => {
      const record: AnswerRecord = {
        question_key: questionKey,
        question_text: questionText,
        answer_text: answerText,
        is_followup: isFollowup,
      };
      setAnswers((prev) => ({ ...prev, [questionKey]: record }));
      const { ok } = await saveAnswer({
        projectId,
        questionKey,
        questionText,
        answerText,
        isFollowup,
      });
      setSaveError(!ok);
      return ok;
    },
    [projectId]
  );

  // 入力中の自動保存（1.5秒デバウンス）
  useEffect(() => {
    if (view.mode !== "question" || draft.trim() === "") return;
    const q = getQuestion(tree, view.pos);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void persist(q.key, q.text, draft.trim(), false);
    }, 1500);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [draft, view, tree, persist]);

  /** 質問画面から次へ（answered=false ならスキップ） */
  async function advanceQuestion(answered: boolean) {
    if (view.mode !== "question" || busy) return;
    setBusy(true);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    const q = getQuestion(tree, view.pos);
    await persist(q.key, q.text, answered ? draft.trim() : null, false);
    setDraft("");
    const next = nextPosition(tree, view.pos);
    if (next) {
      setView({ mode: "question", pos: next });
    } else {
      // セクション末 → サマリーへ
      const section = tree.sections[view.pos.sectionIndex];
      const drafts: Record<string, string> = {};
      for (const question of section.questions) {
        const key = question.key;
        const existing =
          key === q.key
            ? answered
              ? draft.trim()
              : ""
            : (answers[key]?.answer_text ?? "");
        drafts[key] = existing ?? "";
      }
      setSummaryDrafts(drafts);
      setView({ mode: "summary", sectionIndex: view.pos.sectionIndex });
    }
    setBusy(false);
  }

  /** サマリー確定 → 深掘り生成 → 次セクション or 完了 */
  async function submitSummary() {
    if (view.mode !== "summary" || busy) return;
    setBusy(true);
    const section = tree.sections[view.sectionIndex];

    // 編集された回答を保存
    for (const q of section.questions) {
      const edited = (summaryDrafts[q.key] ?? "").trim();
      const original = (answers[q.key]?.answer_text ?? "").trim();
      if (edited !== original) {
        await persist(q.key, q.text, edited === "" ? null : edited, false);
      }
    }

    // 深掘り質問の生成（失敗してもフローを止めない）
    setGeneratingFollowups(true);
    const followups = await requestFollowups(projectId, section.id);
    setGeneratingFollowups(false);

    if (followups.length > 0) {
      setFollowupQuestions(followups);
      setAnswers((prev) => {
        const next = { ...prev };
        for (const f of followups) next[f.question_key] = f;
        return next;
      });
      setView({ mode: "followup", sectionIndex: view.sectionIndex, index: 0 });
    } else {
      await gotoNextSection(view.sectionIndex);
    }
    setBusy(false);
  }

  /** 深掘り質問に回答/スキップして次へ */
  async function advanceFollowup(answered: boolean) {
    if (view.mode !== "followup" || busy) return;
    setBusy(true);
    const f = followupQuestions[view.index];
    await persist(
      f.question_key,
      f.question_text,
      answered ? draft.trim() : null,
      true
    );
    setDraft("");
    if (view.index + 1 < followupQuestions.length) {
      setView({ ...view, index: view.index + 1 });
    } else {
      setFollowupQuestions([]);
      await gotoNextSection(view.sectionIndex);
    }
    setBusy(false);
  }

  async function gotoNextSection(sectionIndex: number) {
    const next = nextSectionStart(tree, sectionIndex);
    if (next) {
      setView({ mode: "question", pos: next });
    } else {
      await completeInterview(projectId);
      setView({ mode: "done" });
    }
  }

  // 全問回答済みで開いた場合も review へ進めておく（冪等）
  useEffect(() => {
    if (view.mode === "done") void completeInterview(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.mode]);

  // ===== 画面 =====

  if (view.mode === "done") {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-24 text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="mt-4 text-2xl font-bold">
          すべての質問にお答えいただきました
        </h1>
        <p className="mt-4 text-gray-600">
          お疲れさまでした。回答をもとに、事業概要書を作成できます。
        </p>
        <Link
          href={`/projects/${projectId}`}
          className="mt-8 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
        >
          事業のページへ戻る
        </Link>
      </main>
    );
  }

  const sectionIndex =
    view.mode === "question" ? view.pos.sectionIndex : view.sectionIndex;
  const section = tree.sections[sectionIndex];

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      {/* 進捗 */}
      <div className="mb-8">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>
            {businessName}｜セクション {sectionIndex + 1}／
            {tree.sections.length}：{section.title}
          </span>
          <span>全体 {progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {saveError && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          保存に失敗しました。通信環境をご確認ください。このまま続けると回答が失われる場合があります。
        </p>
      )}

      {view.mode === "question" && (
        <QuestionScreen
          key={getQuestion(tree, view.pos).key}
          sectionTitle={section.title}
          intro={view.pos.questionIndex === 0 ? section.intro : undefined}
          questionNumber={view.pos.questionIndex + 1}
          questionCount={section.questions.length}
          text={getQuestion(tree, view.pos).text}
          hint={getQuestion(tree, view.pos).hint}
          input={getQuestion(tree, view.pos).input ?? "textarea"}
          draft={draft}
          onChange={setDraft}
          busy={busy}
          onNext={() => void advanceQuestion(true)}
          onSkip={() => void advanceQuestion(false)}
        />
      )}

      {view.mode === "summary" && (
        <div>
          <h1 className="text-xl font-bold">
            「{section.title}」の回答を確認してください
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            直したいところがあれば、そのまま書き換えられます。
          </p>
          <div className="mt-6 flex flex-col gap-5">
            {section.questions.map((q) => (
              <div key={q.key}>
                <p className="mb-1 text-sm font-medium text-gray-700">
                  {q.text}
                </p>
                <textarea
                  value={summaryDrafts[q.key] ?? ""}
                  onChange={(e) =>
                    setSummaryDrafts((prev) => ({
                      ...prev,
                      [q.key]: e.target.value,
                    }))
                  }
                  placeholder="（未回答）"
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => void submitSummary()}
            disabled={busy}
            className="mt-8 w-full rounded-lg bg-blue-700 px-4 py-3 text-base font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {generatingFollowups
              ? "回答を確認しています…"
              : busy
                ? "保存中…"
                : "この内容で次へ進む"}
          </button>
        </div>
      )}

      {view.mode === "followup" && followupQuestions[view.index] && (
        <QuestionScreen
          key={followupQuestions[view.index].question_key}
          sectionTitle={section.title}
          intro="回答を拝見して、もう少しだけお聞きしたいことがあります。"
          questionNumber={view.index + 1}
          questionCount={followupQuestions.length}
          text={followupQuestions[view.index].question_text}
          input="textarea"
          draft={draft}
          onChange={setDraft}
          busy={busy}
          onNext={() => void advanceFollowup(true)}
          onSkip={() => void advanceFollowup(false)}
          isFollowup
        />
      )}
    </main>
  );
}

interface QuestionScreenProps {
  sectionTitle: string;
  intro?: string;
  questionNumber: number;
  questionCount: number;
  text: string;
  hint?: string;
  input: "text" | "textarea";
  draft: string;
  onChange: (v: string) => void;
  busy: boolean;
  onNext: () => void;
  onSkip: () => void;
  isFollowup?: boolean;
}

function QuestionScreen({
  intro,
  questionNumber,
  questionCount,
  text,
  hint,
  input,
  draft,
  onChange,
  busy,
  onNext,
  onSkip,
  isFollowup,
}: QuestionScreenProps) {
  return (
    <div>
      {intro && (
        <p
          className={`mb-4 rounded-lg p-3 text-sm ${
            isFollowup
              ? "bg-violet-50 text-violet-800"
              : "bg-blue-50 text-blue-800"
          }`}
        >
          {intro}
        </p>
      )}
      <p className="text-xs text-gray-400">
        {isFollowup ? "追加の質問" : "質問"} {questionNumber}／{questionCount}
      </p>
      <h1 className="mt-2 text-xl font-bold leading-relaxed">{text}</h1>
      {hint && <p className="mt-2 text-sm text-gray-500">{hint}</p>}

      {input === "text" ? (
        <input
          type="text"
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
        />
      ) : (
        <textarea
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          rows={5}
          placeholder="思いつくままで結構です"
          className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
        />
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onSkip}
          disabled={busy}
          className="text-sm text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
        >
          わからない／後で答える
        </button>
        <button
          onClick={onNext}
          disabled={busy || draft.trim() === ""}
          className="rounded-lg bg-blue-700 px-8 py-3 text-base font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {busy ? "保存中…" : "次へ"}
        </button>
      </div>
    </div>
  );
}
