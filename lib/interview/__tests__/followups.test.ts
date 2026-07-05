import { describe, expect, it } from "vitest";
import {
  assignFollowupKeys,
  buildTranscript,
  hasGeneratedFollowups,
  parseFollowupResponse,
} from "../followups";
import { toAnswerMap } from "../engine";
import type { AnswerRecord, InterviewTree } from "../types";

function record(
  key: string,
  answer: string | null,
  isFollowup = false,
  questionText = "q"
): AnswerRecord {
  return {
    question_key: key,
    question_text: questionText,
    answer_text: answer,
    is_followup: isFollowup,
  };
}

describe("parseFollowupResponse", () => {
  it("正しいJSONから質問文を取り出す", () => {
    const raw = JSON.stringify({
      questions: [
        { text: "従業員の勤務体制をもう少し教えてください。", reason: "矛盾" },
        { text: "レシピはどこに保管していますか？" },
      ],
    });
    expect(parseFollowupResponse(raw)).toEqual([
      "従業員の勤務体制をもう少し教えてください。",
      "レシピはどこに保管していますか？",
    ]);
  });

  it("コードフェンスや前置きが混ざっていても抽出できる", () => {
    const raw =
      '追加質問を作成しました。\n```json\n{"questions":[{"text":"営業時間について教えてください。"}]}\n```';
    expect(parseFollowupResponse(raw)).toEqual([
      "営業時間について教えてください。",
    ]);
  });

  it("最大3問に切り詰める", () => {
    const raw = JSON.stringify({
      questions: [
        { text: "1" },
        { text: "2" },
        { text: "3" },
        { text: "4" },
        { text: "5" },
      ],
    });
    expect(parseFollowupResponse(raw)).toHaveLength(3);
  });

  it("壊れたJSONや形式違いは空配列（フローを止めない）", () => {
    expect(parseFollowupResponse("すみません、質問はありません。")).toEqual([]);
    expect(parseFollowupResponse('{"questions": "なし"}')).toEqual([]);
    expect(parseFollowupResponse('{"questions": [{"tex')).toEqual([]);
    expect(parseFollowupResponse("")).toEqual([]);
  });

  it("空文字の質問は除外する", () => {
    const raw = JSON.stringify({
      questions: [{ text: "  " }, { text: "有効な質問" }],
    });
    expect(parseFollowupResponse(raw)).toEqual(["有効な質問"]);
  });
});

describe("assignFollowupKeys", () => {
  it("既存キーと衝突しない連番を振る", () => {
    const answers = toAnswerMap([
      record("basic.followup.1", "済", true),
      record("basic.followup.2", null, true),
    ]);
    expect(assignFollowupKeys("basic", answers, 2)).toEqual([
      "basic.followup.3",
      "basic.followup.4",
    ]);
  });

  it("既存がなければ1から", () => {
    expect(assignFollowupKeys("risks", {}, 3)).toEqual([
      "risks.followup.1",
      "risks.followup.2",
      "risks.followup.3",
    ]);
  });
});

describe("hasGeneratedFollowups", () => {
  it("該当セクションの深掘りキーの有無で判定する", () => {
    const answers = toAnswerMap([record("basic.followup.1", null, true)]);
    expect(hasGeneratedFollowups("basic", answers)).toBe(true);
    expect(hasGeneratedFollowups("risks", answers)).toBe(false);
  });
});

describe("buildTranscript", () => {
  const tree: InterviewTree = {
    industry: "restaurant",
    sections: [
      {
        id: "basic",
        title: "基本",
        questions: [
          { key: "basic.name", text: "屋号は？" },
          { key: "basic.staff", text: "従業員は？" },
        ],
      },
    ],
  };

  it("回答・未回答・深掘りを含むトランスクリプトを作る", () => {
    const answers = toAnswerMap([
      record("basic.name", "やまだ食堂"),
      record("basic.staff", null),
      record("basic.followup.1", "はい", true, "シフト制ですか？"),
    ]);
    const t = buildTranscript(tree, answers);
    expect(t).toContain("■ 基本");
    expect(t).toContain("Q: 屋号は？");
    expect(t).toContain("A: やまだ食堂");
    expect(t).toContain("A: （未回答）");
    expect(t).toContain("Q(追加): シフト制ですか？");
  });
});
