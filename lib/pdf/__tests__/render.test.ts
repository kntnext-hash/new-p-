import { describe, expect, it } from "vitest";
import { renderOverviewHtml } from "../render";
import type { DocumentContent } from "@/lib/types";

const content: DocumentContent = {
  summary: "昭和60年創業の食堂。",
  business_overview: "屋号はやまだ食堂。",
  products: "味噌煮込みうどんが主力。",
  customers: "常連が半数。",
  suppliers: "", // 空はテンプレート側で「情報なし」表記
  operations: "店主とパート2名で運営。",
  assets_licenses: "飲食店営業許可あり。",
  risks_handover: "タレの仕込みは店主のみが知る。",
  nonname_sheet: {
    industry_label: "飲食店",
    region: "愛知県",
    summary: "県内の食堂。",
    strengths: "常連客が多い。",
    scale: "従業員3名。",
    handover_notes: "従業員の継続雇用を希望。",
  },
};

describe("renderOverviewHtml", () => {
  it("本編の全セクションとノンネームシートを含むHTMLを生成する", async () => {
    const html = await renderOverviewHtml({
      businessName: "やまだ食堂",
      industryLabel: "飲食",
      content,
      version: 1,
      generatedAt: "2026年7月5日",
    });
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("やまだ食堂");
    expect(html).toContain("事業の概要");
    expect(html).toContain("リスク・引継ぎ事項");
    expect(html).toContain("ノンネームシート");
    expect(html).toContain("第1版");
    // 空フィールドは「情報なし」と表記される
    expect(html).toContain("情報なし");
  });

  it("ノンネームシート部分に屋号が含まれない（マスクはLLM側だが、テンプレートが実名を差し込まないこと）", async () => {
    const html = await renderOverviewHtml({
      businessName: "やまだ食堂",
      industryLabel: "飲食",
      content,
      version: 2,
      generatedAt: "2026年7月5日",
    });
    // ノンネームページはページ分割マーカー以降
    const nonnamePart = html.slice(html.indexOf("ノンネームシート"));
    expect(nonnamePart).not.toContain("やまだ食堂");
  });
});
