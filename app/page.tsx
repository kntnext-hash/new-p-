import Link from "next/link";
import { PRICE_JPY } from "@/lib/types";

const STEPS = [
  {
    title: "質問に答える",
    body: "「お店の名前は？」「よく出るメニューは？」——約30問のかんたんな質問に、思いつくままお答えください。途中でやめても、続きから再開できます。",
  },
  {
    title: "AIが文書にまとめる",
    body: "回答をもとに、譲り先・後継者への説明に使える「事業概要書」をAIが作成。足りないところは追加の質問でおぎないます。",
  },
  {
    title: "PDFで受け取る",
    body: "内容を確認・修正したら、PDFでダウンロード。お相手に最初に見せられる匿名の1枚（ノンネームシート）も付きます。",
  },
];

const FAQS = [
  {
    q: "パソコンが苦手でも使えますか？",
    a: "質問に文字で答えていくだけです。書類づくりの知識は必要ありません。ご家族や税理士さんが代わりに入力することもできます。",
  },
  {
    q: "料金はいつ払いますか？",
    a: "質問への回答と概要のお試し表示までは無料です。できあがった概要書の全文とPDFを受け取る時にだけ、お支払いいただきます。",
  },
  {
    q: "書いた内容は他の人に見られませんか？",
    a: "回答と文書はご本人のアカウントからしか見られません。匿名シート以外を誰かに渡すかどうかは、すべてご自身で決められます。",
  },
];

export default function Home() {
  return (
    <main>
      {/* 課題 → 価値提案 */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-16 pt-20 text-center">
        <p className="rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-blue-800">
          お店や工場を、つぎの人へ
        </p>
        <h1 className="mt-6 text-3xl font-bold leading-relaxed sm:text-4xl sm:leading-relaxed">
          「うちの商売を説明する書類」を、
          <br />
          質問に答えるだけで
        </h1>
        <p className="mt-6 max-w-xl leading-relaxed text-gray-600">
          事業の売却や承継の話を進めるには、事業の中身をまとめた「事業概要書」が要ります。
          でも、長年商売をされてきた方ほど、大事なことは頭の中。
          ツグモノは、かんたんな質問に答えるだけで、その頭の中を1冊の書類にまとめます。
        </p>
        <Link
          href="/login"
          className="mt-10 rounded-lg bg-blue-700 px-10 py-4 text-lg font-semibold text-white hover:bg-blue-800"
        >
          無料で質問に答えてみる
        </Link>
        <p className="mt-3 text-xs text-gray-400">
          回答は無料。お支払いはPDFを受け取る時だけ。
        </p>
      </section>

      {/* 使い方（デモ） */}
      <section className="border-t border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto w-full max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold">使い方は3つだけ</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <p className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                  {i + 1}
                </p>
                <h3 className="mt-4 font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          {/* 画面イメージ（1問1画面の再現） */}
          <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-2/5 rounded-full bg-blue-600" />
            </div>
            <p className="text-xs text-gray-400">質問 3／5</p>
            <p className="mt-2 text-lg font-bold">
              お店の主力メニュー・看板メニューは何ですか？
            </p>
            <p className="mt-1 text-sm text-gray-500">
              例：味噌煮込みうどん、日替わり定食
            </p>
            <div className="mt-4 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700">
              創業からつぎ足しの味噌ダレで作る、味噌煮込みうどんです。
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-400 underline">
                わからない／後で答える
              </span>
              <span className="rounded-lg bg-blue-700 px-6 py-2 text-sm font-semibold text-white">
                次へ
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 価格 */}
      <section className="py-16">
        <div className="mx-auto w-full max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold">料金</h2>
          <div className="mx-auto mt-8 max-w-md rounded-2xl border-2 border-blue-700 p-8">
            <p className="text-sm font-medium text-gray-500">
              事業概要書一式（ノンネームシート付きPDF）
            </p>
            <p className="mt-3 text-4xl font-bold">
              {PRICE_JPY.toLocaleString()}
              <span className="text-lg font-medium">円</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              買い切り・1事業につき1回のみ
            </p>
            <ul className="mt-6 space-y-2 text-left text-sm text-gray-700">
              <li>✓ 質問への回答・お試し表示は無料</li>
              <li>✓ 何度でも修正してPDFを作り直せます</li>
              <li>✓ 月額料金はありません</li>
            </ul>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            仲介会社に文書化を依頼すると数十万円かかることもあります。
          </p>
        </div>
      </section>

      {/* よくある質問 */}
      <section className="border-t border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto w-full max-w-3xl px-6">
          <h2 className="text-center text-2xl font-bold">よくあるご質問</h2>
          <div className="mt-8 space-y-4">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <summary className="cursor-pointer font-semibold">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 最後のCTA */}
      <section className="py-20 text-center">
        <h2 className="text-2xl font-bold leading-relaxed">
          あなたの商売の価値を、
          <br className="sm:hidden" />
          伝わるかたちに。
        </h2>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-blue-700 px-10 py-4 text-lg font-semibold text-white hover:bg-blue-800"
        >
          無料で始める
        </Link>
      </section>
    </main>
  );
}
