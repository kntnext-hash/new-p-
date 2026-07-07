"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">エラーが発生しました</h1>
      <p className="mt-4 text-gray-600">
        申し訳ありません。うまく表示できませんでした。
        <br />
        もう一度お試しいただくか、時間をおいてアクセスしてください。
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
      >
        もう一度試す
      </button>
    </main>
  );
}
