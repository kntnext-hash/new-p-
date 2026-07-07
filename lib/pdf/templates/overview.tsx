import type { DocumentContent } from "@/lib/types";

export interface OverviewTemplateProps {
  businessName: string;
  industryLabel: string;
  content: DocumentContent;
  version: number;
  generatedAt: string; // 例: 2026年7月5日
}

/** 改行を保ったままテキストを描画する */
function Body({ text }: { text: string }) {
  return (
    <p style={{ whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.9 }}>
      {text || "情報なし"}
    </p>
  );
}

function SectionBlock({
  no,
  title,
  text,
}: {
  no: number;
  title: string;
  text: string;
}) {
  return (
    <section style={{ marginBottom: "7mm", breakInside: "avoid" }}>
      <h2
        style={{
          fontSize: "11.5pt",
          borderLeft: "3.5pt solid #1d4ed8",
          borderBottom: "0.5pt solid #cbd5e1",
          padding: "1mm 0 1mm 3mm",
          margin: "0 0 2.5mm 0",
        }}
      >
        {no}. {title}
      </h2>
      <Body text={text} />
    </section>
  );
}

/**
 * 事業概要書のPDF用HTMLテンプレート。
 * 本編（実名）＋最終ページにノンネームシート（特定情報マスク済み）。
 */
export function OverviewTemplate({
  businessName,
  industryLabel,
  content,
  version,
  generatedAt,
}: OverviewTemplateProps) {
  const n = content.nonname_sheet;
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          @page { size: A4; margin: 18mm 16mm; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif;
            font-size: 10pt;
            color: #1f2937;
            margin: 0;
          }
        `}</style>
      </head>
      <body>
        {/* ===== 表紙ヘッダー＋本編 ===== */}
        <header
          style={{
            borderBottom: "2pt solid #1d4ed8",
            paddingBottom: "4mm",
            marginBottom: "8mm",
          }}
        >
          <p style={{ margin: 0, fontSize: "9pt", color: "#64748b" }}>
            事業概要書（{industryLabel}）
          </p>
          <h1 style={{ margin: "1mm 0 0 0", fontSize: "18pt" }}>
            {businessName}
          </h1>
          <p style={{ margin: "2mm 0 0 0", fontSize: "8.5pt", color: "#64748b" }}>
            {`作成日: ${generatedAt}　版: 第${version}版　作成: ツグモノ`}
          </p>
        </header>

        <section style={{ marginBottom: "8mm" }}>
          <h2
            style={{
              fontSize: "11.5pt",
              background: "#eff6ff",
              padding: "2mm 3mm",
              margin: "0 0 2.5mm 0",
            }}
          >
            事業の概要
          </h2>
          <Body text={content.summary} />
        </section>

        <SectionBlock no={1} title="事業基本情報" text={content.business_overview} />
        <SectionBlock no={2} title="商品・サービス" text={content.products} />
        <SectionBlock no={3} title="顧客" text={content.customers} />
        <SectionBlock no={4} title="仕入・取引先" text={content.suppliers} />
        <SectionBlock no={5} title="オペレーション" text={content.operations} />
        <SectionBlock no={6} title="資産・許認可" text={content.assets_licenses} />
        <SectionBlock no={7} title="リスク・引継ぎ事項" text={content.risks_handover} />

        {/* ===== ノンネームシート（別ページ・実名なし） ===== */}
        <div style={{ pageBreakBefore: "always" }}>
          <header
            style={{
              borderBottom: "2pt solid #475569",
              paddingBottom: "4mm",
              marginBottom: "8mm",
            }}
          >
            <p style={{ margin: 0, fontSize: "9pt", color: "#64748b" }}>
              匿名概要（ノンネームシート）
            </p>
            <h1 style={{ margin: "1mm 0 0 0", fontSize: "16pt" }}>
              {n.industry_label}（{n.region}）
            </h1>
            <p style={{ margin: "2mm 0 0 0", fontSize: "8.5pt", color: "#64748b" }}>
              本ページは事業者を特定できる情報を伏せています。検討初期の情報提供にご利用ください。
            </p>
          </header>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "10pt",
            }}
          >
            <tbody>
              {[
                ["業種", n.industry_label],
                ["地域", n.region],
                ["事業概要", n.summary],
                ["強み・特徴", n.strengths],
                ["規模感", n.scale],
                ["引継ぎに関する希望", n.handover_notes],
              ].map(([label, value]) => (
                <tr key={label}>
                  <th
                    style={{
                      border: "0.5pt solid #cbd5e1",
                      background: "#f8fafc",
                      padding: "3mm",
                      width: "32mm",
                      textAlign: "left",
                      verticalAlign: "top",
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </th>
                  <td
                    style={{
                      border: "0.5pt solid #cbd5e1",
                      padding: "3mm",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.9,
                    }}
                  >
                    {value || "情報なし"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  );
}
