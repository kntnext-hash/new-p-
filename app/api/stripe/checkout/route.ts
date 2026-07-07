import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStripe } from "@/lib/stripe/client";
import { isPaid } from "@/lib/payment";
import { PRICE_JPY, type Project } from "@/lib/types";

/** Stripe Checkout セッションを作成してURLを返す */
export async function POST(request: NextRequest) {
  let body: { projectId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.projectId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", body.projectId)
    .single<Project>();
  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (isPaid(project.status)) {
    return NextResponse.json({ error: "already_paid" }, { status: 409 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const stripe = createStripe();

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${appUrl}/projects/${project.id}/document?paid=1`,
      cancel_url: `${appUrl}/projects/${project.id}/document?canceled=1`,
      metadata: { project_id: project.id },
      customer_email: user.email,
    });
  } catch {
    return NextResponse.json({ error: "stripe_failed" }, { status: 502 });
  }
  if (!session.url) {
    return NextResponse.json({ error: "stripe_failed" }, { status: 502 });
  }

  // pending の決済記録（Webhookが paid に更新する）。書き込みは service role のみ
  const admin = createAdminClient();
  const { error } = await admin.from("purchases").insert({
    project_id: project.id,
    stripe_session_id: session.id,
    amount: PRICE_JPY,
    status: "pending",
  });
  if (error) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
