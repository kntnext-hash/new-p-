import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTree } from "@/lib/interview/trees";
import type { AnswerRecord } from "@/lib/interview/types";
import type { Project } from "@/lib/types";
import InterviewClient from "./interview-client";

export const metadata = {
  title: "質問に答える | ツグモノ",
};

export default async function InterviewPage({
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

  const { data: answers } = await supabase
    .from("answers")
    .select("question_key, question_text, answer_text, is_followup")
    .eq("project_id", id);

  const tree = getTree(project.industry);

  return (
    <InterviewClient
      projectId={project.id}
      businessName={project.business_name}
      tree={tree}
      initialAnswers={(answers ?? []) as AnswerRecord[]}
    />
  );
}
