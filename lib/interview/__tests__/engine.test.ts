import { describe, expect, it } from "vitest";
import {
  firstUnvisitedPosition,
  isAnswered,
  isVisited,
  nextPosition,
  nextSectionStart,
  pendingFollowups,
  requiredAnswerRate,
  sectionVisitedCount,
  toAnswerMap,
  totalQuestions,
  totalVisitedCount,
} from "../engine";
import type { AnswerRecord, InterviewTree } from "../types";

/** テスト用の最小ツリー（2セクション・4問） */
const tree: InterviewTree = {
  industry: "restaurant",
  sections: [
    {
      id: "basic",
      title: "基本",
      questions: [
        { key: "basic.name", text: "屋号は？", required: true },
        { key: "basic.location", text: "場所は？", required: true },
      ],
    },
    {
      id: "risks",
      title: "リスク",
      questions: [
        { key: "risks.owner_only", text: "自分しか知らないことは？", required: true },
        { key: "risks.concerns", text: "心配事は？" },
      ],
    },
  ],
};

function record(
  key: string,
  answer: string | null,
  isFollowup = false
): AnswerRecord {
  return {
    question_key: key,
    question_text: "q",
    answer_text: answer,
    is_followup: isFollowup,
  };
}

describe("toAnswerMap / isVisited / isAnswered", () => {
  it("回答済み・スキップ済み・未回答を区別する", () => {
    const answers = toAnswerMap([
      record("basic.name", "やまだ食堂"),
      record("basic.location", null), // スキップ
    ]);
    expect(isVisited("basic.name", answers)).toBe(true);
    expect(isAnswered("basic.name", answers)).toBe(true);
    expect(isVisited("basic.location", answers)).toBe(true);
    expect(isAnswered("basic.location", answers)).toBe(false);
    expect(isVisited("risks.owner_only", answers)).toBe(false);
  });

  it("空白のみの回答は未回答扱い", () => {
    const answers = toAnswerMap([record("basic.name", "   ")]);
    expect(isAnswered("basic.name", answers)).toBe(false);
  });
});

describe("進捗カウント", () => {
  it("全質問数を数える", () => {
    expect(totalQuestions(tree)).toBe(4);
  });

  it("記録済み数はスキップも含む", () => {
    const answers = toAnswerMap([
      record("basic.name", "やまだ食堂"),
      record("basic.location", null),
    ]);
    expect(sectionVisitedCount(tree.sections[0], answers)).toBe(2);
    expect(totalVisitedCount(tree, answers)).toBe(2);
  });

  it("深掘り質問（followup）は静的ツリーの進捗に影響しない", () => {
    const answers = toAnswerMap([
      record("basic.followup.1", "追加回答", true),
    ]);
    expect(totalVisitedCount(tree, answers)).toBe(0);
  });
});

describe("ツリー遷移", () => {
  it("未回答の先頭位置から再開する", () => {
    const answers = toAnswerMap([record("basic.name", "やまだ食堂")]);
    expect(firstUnvisitedPosition(tree, answers)).toEqual({
      sectionIndex: 0,
      questionIndex: 1,
    });
  });

  it("スキップした質問は再開時に再提示しない", () => {
    const answers = toAnswerMap([
      record("basic.name", "やまだ食堂"),
      record("basic.location", null),
    ]);
    expect(firstUnvisitedPosition(tree, answers)).toEqual({
      sectionIndex: 1,
      questionIndex: 0,
    });
  });

  it("全問記録済みなら再開位置は null", () => {
    const answers = toAnswerMap([
      record("basic.name", "a"),
      record("basic.location", "b"),
      record("risks.owner_only", "c"),
      record("risks.concerns", null),
    ]);
    expect(firstUnvisitedPosition(tree, answers)).toBeNull();
  });

  it("セクション内の次の質問へ進む", () => {
    expect(nextPosition(tree, { sectionIndex: 0, questionIndex: 0 })).toEqual({
      sectionIndex: 0,
      questionIndex: 1,
    });
  });

  it("セクション末では null（サマリーへ）", () => {
    expect(
      nextPosition(tree, { sectionIndex: 0, questionIndex: 1 })
    ).toBeNull();
  });

  it("次のセクション先頭へ進む／最終セクションなら null", () => {
    expect(nextSectionStart(tree, 0)).toEqual({
      sectionIndex: 1,
      questionIndex: 0,
    });
    expect(nextSectionStart(tree, 1)).toBeNull();
  });
});

describe("pendingFollowups", () => {
  it("未回答の深掘りだけをキー順で返す", () => {
    const answers = toAnswerMap([
      record("basic.followup.2", null, true),
      record("basic.followup.1", null, true),
      record("basic.followup.3", "回答済み", true),
      record("risks.followup.1", null, true),
      record("basic.name", null), // followupでないものは対象外
    ]);
    const pending = pendingFollowups("basic", answers);
    expect(pending.map((a) => a.question_key)).toEqual([
      "basic.followup.1",
      "basic.followup.2",
    ]);
  });
});

describe("requiredAnswerRate（M3品質ガード）", () => {
  it("必須質問の回答率を計算する", () => {
    const answers = toAnswerMap([
      record("basic.name", "やまだ食堂"),
      record("basic.location", null), // スキップは未回答扱い
      record("risks.owner_only", "タレの仕込み"),
    ]);
    // 必須3問中2問回答
    expect(
      requiredAnswerRate(tree, answers, ["basic", "products", "risks"])
    ).toBeCloseTo(2 / 3);
  });

  it("必須質問がなければ 1 を返す", () => {
    const noRequired: InterviewTree = {
      industry: "retail",
      sections: [
        { id: "basic", title: "基本", questions: [{ key: "basic.a", text: "?" }] },
      ],
    };
    expect(requiredAnswerRate(noRequired, {}, ["basic"])).toBe(1);
  });
});
