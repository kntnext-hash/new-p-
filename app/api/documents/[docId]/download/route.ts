import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPaid } from "@/lib/payment";
import type { ProjectStatus } from "@/lib/types";

/** 所有権を確認のうえ、署名付きURLへリダイレクトしてPDFをダウンロードさせる */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // RLSにより本人のプロジェクトの文書のみ取得できる
  const { data: doc } = await supabase
    .from("documents")
    .select("id, pdf_path, version, project_id, projects(status)")
    .eq("id", docId)
    .single<{
      id: string;
      pdf_path: string | null;
      version: number;
      project_id: string;
      projects: { status: ProjectStatus };
    }>();
  if (!doc || !doc.pdf_path) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // 課金ゲート：未決済ではPDFをダウンロードさせない
  if (!isPaid(doc.projects.status)) {
    return NextResponse.json({ error: "payment_required" }, { status: 402 });
  }

  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from("documents")
    .createSignedUrl(doc.pdf_path, 60, {
      download: `事業概要書_第${doc.version}版.pdf`,
    });
  if (error || !signed) {
    return NextResponse.json({ error: "sign_failed" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
