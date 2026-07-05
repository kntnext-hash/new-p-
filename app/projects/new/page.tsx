import { createProject } from "../actions";
import { INDUSTRY_LABELS, type Industry } from "@/lib/types";

export const metadata = {
  title: "新しい事業を登録 | ツグモノ",
};

const INDUSTRY_DESCRIPTIONS: Record<Industry, string> = {
  restaurant: "食堂・居酒屋・カフェ・弁当店など",
  retail: "商店・専門店・ネット販売など",
  manufacturing: "町工場・食品加工・手仕事の工房など",
};

const ERROR_MESSAGES: Record<string, string> = {
  industry: "業種を選んでください。",
  name: "屋号（お店や会社の名前）を入力してください。",
  create: "登録に失敗しました。もう一度お試しください。",
};

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">新しい事業を登録</h1>
      <p className="mb-8 text-sm text-gray-600">
        概要書を作りたい事業について教えてください。あとから変更できます。
      </p>

      {error && ERROR_MESSAGES[error] && (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={createProject} className="flex flex-col gap-8">
        <fieldset>
          <legend className="mb-3 text-sm font-medium">業種を選ぶ</legend>
          <div className="flex flex-col gap-3">
            {(Object.keys(INDUSTRY_LABELS) as Industry[]).map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
              >
                <input
                  type="radio"
                  name="industry"
                  value={key}
                  required
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold">
                    {INDUSTRY_LABELS[key]}
                  </span>
                  <span className="block text-sm text-gray-500">
                    {INDUSTRY_DESCRIPTIONS[key]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            屋号（お店や会社の名前）
          </span>
          <input
            type="text"
            name="business_name"
            required
            maxLength={100}
            placeholder="例：やまだ食堂"
            className="rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-blue-700 px-4 py-3 text-base font-semibold text-white hover:bg-blue-800"
        >
          登録して進む
        </button>
      </form>
    </main>
  );
}
