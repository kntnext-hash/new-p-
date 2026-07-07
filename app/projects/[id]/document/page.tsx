import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPaid } from "@/lib/payment";
import { INDUSTRY_LABELS, type DocumentRow, type Project } from "@/lib/types";
import DocumentClient from "./document-client";

export const metadata = {
  title: "事業概要書 | ツグモノ",
};

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; canceled?: string }>;
}) {
  const { id } = await params;
  const { paid: paidParam, canceled } = await searchParams;
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

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<DocumentRow>();

  if (!doc) redirect(`/projects/${id}`);

  const paid = isPaid(project.status);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href={`/projects/${id}`}
        className="text-sm text-blue-700 hover:underline"
      >
        ← {project.business_name} に戻る
      </Link>
      <h1 className="mt-4 text-2xl font-bold">事業概要書</h1>
      <p className="mt-1 text-sm text-gray-500">
        {project.business_name}（{INDUSTRY_LABELS[project.industry]}）
      </p>

      {paidParam === "1" && !paid && (
        <p className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          お支払いを確認しています。反映まで1〜2分かかることがあります。しばらくしてからページを再読み込みしてください。
        </p>
      )}
      {canceled === "1" && !paid && (
        <p className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          お支払いは行われませんでした。準備ができたら、いつでもお手続きいただけます。
        </p>
      )}

      <DocumentClient
        projectId={id}
        paid={paid}
        initialDocument={{
          id: doc.id,
          version: doc.version,
          content: doc.content_json,
          hasPdf: !!doc.pdf_path,
        }}
      />
    </main>
  );
}
