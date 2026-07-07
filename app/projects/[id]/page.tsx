import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTree } from "@/lib/interview/trees";
import {
  toAnswerMap,
  totalQuestions,
  totalVisitedCount,
} from "@/lib/interview/engine";
import type { AnswerRecord } from "@/lib/interview/types";
import { INDUSTRY_LABELS, type DocumentRow, type Project } from "@/lib/types";
import GenerateButton from "./generate-button";

export const metadata = {
  title: "事業の詳細 | ツグモノ",
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single<Project>();
  if (!project) notFound();

  const { data: answerRows } = await supabase
    .from("answers")
    .select("question_key, question_text, answer_text, is_followup")
    .eq("project_id", id);

  const tree = getTree(project.industry);
  const answers = toAnswerMap((answerRows ?? []) as AnswerRecord[]);
  const total = totalQuestions(tree);
  const visited = totalVisitedCount(tree, answers);
  const interviewDone = visited >= total;
  const percent = Math.round((visited / total) * 100);

  const { data: latestDoc } = await supabase
    .from("documents")
    .select("id, version, pdf_path")
    .eq("project_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<DocumentRow, "id" | "version" | "pdf_path">>();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href="/projects" className="text-sm text-blue-700 hover:underline">
        ← 一覧に戻る
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{project.business_name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {INDUSTRY_LABELS[project.industry]}
      </p>

      {/* ステップ1：質問に答える */}
      <section className="mt-8 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">
              ステップ1：質問に答える
              {interviewDone && (
                <span className="ml-2 text-sm font-normal text-green-700">
                  ✓ 完了
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {visited === 0
                ? `全${total}問。30分ほどで答えられます。途中でやめても続きから再開できます。`
                : `${total}問中 ${visited}問に回答済み（${percent}%）`}
            </p>
          </div>
          <Link
            href={`/projects/${project.id}/interview`}
            className={`shrink-0 rounded-lg px-5 py-3 text-sm font-semibold ${
              interviewDone
                ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                : "bg-blue-700 text-white hover:bg-blue-800"
            }`}
          >
            {visited === 0
              ? "始める"
              : interviewDone
                ? "回答を見直す"
                : "続きから再開"}
          </Link>
        </div>
        {visited > 0 && !interviewDone && (
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </section>

      {/* ステップ2：概要書を作る */}
      <section
        className={`mt-4 rounded-xl border border-gray-200 p-6 ${
          interviewDone ? "" : "opacity-50"
        }`}
      >
        <h2 className="font-semibold">
          ステップ2：事業概要書を作る
          {latestDoc && (
            <span className="ml-2 text-sm font-normal text-green-700">
              ✓ 第{latestDoc.version}版まで作成済み
            </span>
          )}
        </h2>
        <p className="mt-1 mb-4 text-sm text-gray-500">
          {latestDoc
            ? "できあがった概要書の確認・修正・PDFダウンロードができます。"
            : interviewDone
              ? "回答をもとに、事業概要書（PDF）を作成します。"
              : "質問への回答が終わると、ここから概要書を作成できます。"}
        </p>
        {latestDoc ? (
          <Link
            href={`/projects/${project.id}/document`}
            className="inline-block rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
          >
            概要書を見る・直す
          </Link>
        ) : (
          interviewDone && <GenerateButton projectId={project.id} />
        )}
      </section>
    </main>
  );
}
