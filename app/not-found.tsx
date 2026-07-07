import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="mt-4 text-gray-600">
        お探しのページは移動したか、削除された可能性があります。
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
      >
        トップページへ
      </Link>
    </main>
  );
}
