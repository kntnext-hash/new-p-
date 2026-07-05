import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INDUSTRY_LABELS, type Project } from "@/lib/types";

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

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href="/projects" className="text-sm text-blue-700 hover:underline">
        ← 一覧に戻る
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{project.business_name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {INDUSTRY_LABELS[project.industry]}
      </p>

      <div className="mt-8 rounded-xl border border-gray-200 p-6">
        <p className="text-gray-600">
          ここから質問に答えていくと、事業概要書ができあがります。
        </p>
        {/* M1: インタビュー画面への導線をここに実装する */}
      </div>
    </main>
  );
}
