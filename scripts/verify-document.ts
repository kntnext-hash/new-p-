/**
 * M3 AC検証スクリプト：フル回答セット→content_json→A4 PDF。
 *
 * 実行:
 *   npx tsx --env-file=.env.local scripts/verify-document.ts        # LLM生成込み
 *   npx tsx scripts/verify-document.ts --fixture                    # 固定content でPDF化のみ
 *
 * 出力: ./tmp/overview-sample.pdf
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { restaurantTree } from "../lib/interview/trees/restaurant";
import { toAnswerMap } from "../lib/interview/engine";
import { buildTranscript } from "../lib/interview/followups";
import {
  buildDocumentUserPrompt,
  DOCUMENT_SYSTEM_PROMPT,
} from "../lib/interview/prompts/document";
import { createLLM, extractText, LLM_MODEL } from "../lib/llm/client";
import { parseDocumentResponse } from "../lib/pdf/content";
import { htmlToPdf, renderOverviewHtml } from "../lib/pdf/render";
import type { AnswerRecord } from "../lib/interview/types";
import type { DocumentContent } from "../lib/types";

// フル回答セット（一部を意図的に未回答にして「情報なし」表記を確認する）
const answers: AnswerRecord[] = restaurantTree.sections.flatMap((s) =>
  s.questions.map((q): AnswerRecord => {
    const samples: Record<string, string | null> = {
      "basic.name": "やまだ食堂",
      "basic.location": "愛知県名古屋市中区の大須商店街の中",
      "basic.founded": "昭和60年",
      "basic.entity": "個人事業",
      "basic.staff": "私と妻の2人。昼だけパートの田中さんが来る",
      "products.main": "味噌煮込みうどんと日替わり定食",
      "products.price_range": "昼は900円前後、夜は2,500円くらい",
      "products.bestseller": "味噌煮込みうどん。創業からつぎ足しの味噌ダレが評判",
      "products.seasonality": "夏は売上が2割落ちる。冬の煮込みが書き入れ時",
      "products.specialty": "味噌ダレは私が毎朝仕込む。レシピはどこにも書いていない",
      "customers.profile": "近所の年配の常連さんと、昼は近くの会社員",
      "customers.regulars": "6割くらいは顔なじみ",
      "customers.corporate": null, // 未回答
      "customers.channels": "ほぼ口コミと通りがかり",
      "customers.reservation": "ほとんどふらっと来るお客さん",
      "suppliers.main": "麺は大須の製麺所、味噌は岡崎の八丁味噌蔵から直接",
      "suppliers.terms": "月末締めの翌月現金払い",
      "suppliers.substitutes": "味噌だけは代わりが利かない",
      "suppliers.personal": "製麺所は先代からの付き合いで特別に小口配達してくれる",
      "operations.hours": "11時〜14時、17時〜21時。日曜定休",
      "operations.daily": "朝7時に仕込み開始、10時に妻が来て開店準備",
      "operations.keyperson": "調理は全部私。ホールと会計は妻",
      "operations.recipes": "全部頭の中。書いたものはない",
      "operations.shifts": "パートの田中さんは平日昼だけ、あとは夫婦で回す",
      "operations.tools": "レジは古い機械式。帳簿は妻が手書き",
      "assets.property": "店舗は借りていて家賃月9万円。自宅は別",
      "assets.equipment": "業務用冷蔵庫2台（1台は15年もの）、麺茹で機",
      "assets.licenses": "飲食店営業許可、食品衛生責任者は私",
      "assets.leases": null, // 未回答
      "risks.owner_only": "味噌ダレの仕込みと、味噌蔵との価格交渉",
      "risks.key_staff": "妻。ホールも経理も全部任せている",
      "risks.unwritten": "常連の佐藤さんは麺固め、山本さんはご飯少なめ",
      "risks.handover_time": "タレの仕込みを教えるのに半年は一緒に立ちたい",
      "risks.concerns": "屋号と味は残してほしい。田中さんの雇用も続けてほしい",
    };
    return {
      question_key: q.key,
      question_text: q.text,
      answer_text: samples[q.key] ?? null,
      is_followup: false,
    };
  })
);

const fixtureContent: DocumentContent = {
  summary: "昭和60年創業、名古屋市の食堂。味噌煮込みうどんを主力とする。",
  business_overview:
    "・屋号: やまだ食堂\n・所在地: 愛知県名古屋市中区\n・創業: 昭和60年\n・形態: 個人事業\n・従業員: 店主夫婦2名＋パート1名",
  products: "味噌煮込みうどんと日替わり定食。客単価は昼900円前後。",
  customers: "常連比率約6割。集客は口コミ中心。法人取引は情報なし。",
  suppliers: "麺は地元製麺所、味噌は岡崎の蔵元から直接仕入れ。",
  operations: "調理は店主、ホール・経理は妻が担当。レシピは文書化されていない。",
  assets_licenses: "店舗は賃借（月9万円）。飲食店営業許可。リースは情報なし。",
  risks_handover:
    "味噌ダレの仕込みは店主のみが知る。引継ぎには半年程度の並走を想定。",
  nonname_sheet: {
    industry_label: "飲食店（食堂）",
    region: "愛知県",
    summary: "昭和期創業の食堂。名物の煮込み料理で固定客を持つ。",
    strengths: "地域の常連客が売上の過半。仕込みダレによる独自の味。",
    scale: "従業員: 家族2名＋パート1名。客単価: 昼900円前後。",
    handover_notes: "屋号・味の継続と従業員の雇用継続を希望。約半年の引継ぎ並走が可能。",
  },
};

async function main() {
  const useFixture =
    process.argv.includes("--fixture") || !process.env.ANTHROPIC_API_KEY;

  let content: DocumentContent;
  if (useFixture) {
    console.log("固定content でPDF化のみ検証します（--fixture または APIキーなし）");
    content = fixtureContent;
  } else {
    console.log(`モデル ${LLM_MODEL} で content_json を生成中…`);
    const llm = createLLM();
    const message = await llm.messages.create({
      model: LLM_MODEL,
      max_tokens: 4096,
      system: DOCUMENT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildDocumentUserPrompt({
            industryLabel: "飲食",
            businessName: "やまだ食堂",
            transcript: buildTranscript(restaurantTree, toAnswerMap(answers)),
          }),
        },
      ],
    });
    const parsed = parseDocumentResponse(extractText(message));
    if (!parsed) {
      console.error("❌ content_json のパースに失敗");
      process.exit(1);
    }
    content = parsed;
    console.log("content_json 生成OK");

    // AC: 未回答項目（法人取引・リース）が「情報なし」と表記されるか
    const joined = JSON.stringify(content);
    console.log(
      joined.includes("情報なし")
        ? "✅ 「情報なし」表記あり"
        : "⚠️ 「情報なし」表記が見当たらない（要目視確認）"
    );
    // AC: ノンネームに固有名詞が残っていないか
    const nn = JSON.stringify(content.nonname_sheet);
    for (const word of ["やまだ", "大須", "名古屋", "田中", "佐藤", "山本", "岡崎"]) {
      if (nn.includes(word)) console.log(`⚠️ ノンネームに固有名詞の疑い: ${word}`);
    }
  }

  console.log("HTML→PDF 変換中…");
  const html = await renderOverviewHtml({
    businessName: "やまだ食堂",
    industryLabel: "飲食",
    content,
    version: 1,
    generatedAt: new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });
  const pdf = await htmlToPdf(html);
  mkdirSync("tmp", { recursive: true });
  writeFileSync("tmp/overview-sample.pdf", pdf);
  console.log(`✅ tmp/overview-sample.pdf を出力（${Math.round(pdf.length / 1024)}KB）`);
}

main();
