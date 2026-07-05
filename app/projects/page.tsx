import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INDUSTRY_LABELS, type Project, type ProjectStatus } from "@/lib/types";

export const metadata = {
  title: "マイページ | ツグモノ",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "作成済み（回答前）",
  interviewing: "質問に回答中",
  review: "回答完了・確認待ち",
  paid: "お支払い済み",
  generated: "概要書できあがり",
};

const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  interviewing: "bg-blue-100 text-blue-800",
  review: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  generated: "bg-emerald-100 text-emerald-800",
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">あなたの事業</h1>
        <Link
          href="/projects/new"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          ＋ 新しく作る
        </Link>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          データの読み込みに失敗しました。ページを再読み込みしてください。
        </p>
      )}

      {projects && projects.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <p className="mb-4 text-gray-600">
            まだ事業が登録されていません。
            <br />
            「新しく作る」から始めましょう。
          </p>
          <Link
            href="/projects/new"
            className="inline-block rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
          >
            事業概要書づくりを始める
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {(projects as Project[] | null)?.map((p) => (
          <li key={p.id}>
            <Link
              href={`/projects/${p.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:bg-blue-50/30"
            >
              <div>
                <p className="font-semibold">{p.business_name}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {INDUSTRY_LABELS[p.industry]}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[p.status]}`}
              >
                {STATUS_LABELS[p.status]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
