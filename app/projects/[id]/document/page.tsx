import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INDUSTRY_LABELS, type DocumentRow, type Project } from "@/lib/types";
import DocumentClient from "./document-client";

export const metadata = {
  title: "事業概要書 | ツグモノ",
};

export default async function DocumentPage({
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

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<DocumentRow>();

  if (!doc) redirect(`/projects/${id}`);

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
      <DocumentClient
        projectId={id}
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
