import { describe, expect, it } from "vitest";
import { parseDocumentResponse, validateDocumentContent } from "../content";
import type { DocumentContent } from "@/lib/types";

const validContent: DocumentContent = {
  summary: "昭和60年創業の食堂。",
  business_overview: "屋号はやまだ食堂。名古屋市中区。",
  products: "味噌煮込みうどんが主力。",
  customers: "常連が半数。",
  suppliers: "情報なし",
  operations: "店主とパート2名で運営。",
  assets_licenses: "飲食店営業許可あり。",
  risks_handover: "タレの仕込みは店主のみが知る。",
  nonname_sheet: {
    industry_label: "飲食店",
    region: "愛知県",
    summary: "昭和60年創業の食堂。",
    strengths: "常連客が多い。",
    scale: "従業員3名。",
    handover_notes: "従業員の継続雇用を希望。",
  },
};

describe("parseDocumentResponse", () => {
  it("正しいJSONをパースする", () => {
    expect(parseDocumentResponse(JSON.stringify(validContent))).toEqual(
      validContent
    );
  });

  it("コードフェンス付きでも抽出する", () => {
    const raw = "```json\n" + JSON.stringify(validContent) + "\n```";
    expect(parseDocumentResponse(raw)).toEqual(validContent);
  });

  it("フィールド欠落は null（呼び出し側で再試行に誘導）", () => {
    const { nonname_sheet: _omit, ...missing } = validContent;
    expect(parseDocumentResponse(JSON.stringify(missing))).toBeNull();
  });

  it("壊れたJSONは null", () => {
    expect(parseDocumentResponse("すみません")).toBeNull();
    expect(parseDocumentResponse("")).toBeNull();
  });
});

describe("validateDocumentContent", () => {
  it("フォーム編集後の値を検証する", () => {
    expect(validateDocumentContent(validContent)).toEqual(validContent);
    expect(validateDocumentContent({ summary: 1 })).toBeNull();
    expect(validateDocumentContent(null)).toBeNull();
  });
});
