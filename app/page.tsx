import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-3xl font-bold leading-relaxed sm:text-4xl">
        質問に答えるだけで、
        <br />
        事業の「引き継ぎ書類」ができあがる
      </h1>
      <p className="mt-6 max-w-xl text-gray-600">
        ツグモノは、お店や工場の売却・承継に必要な「事業概要書」を、
        かんたんな質問に答えるだけで作れるサービスです。
      </p>
      <Link
        href="/login"
        className="mt-10 rounded-lg bg-blue-700 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-800"
      >
        無料で始める
      </Link>
      {/* M5: 課題→デモGIF→価格→CTA のフルLPに差し替える */}
    </main>
  );
}
