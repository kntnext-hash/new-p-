"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Industry } from "@/lib/types";

const INDUSTRIES: Industry[] = ["restaurant", "retail", "manufacturing"];

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const industry = formData.get("industry");
  const businessName = String(formData.get("business_name") ?? "").trim();

  if (!INDUSTRIES.includes(industry as Industry)) {
    redirect("/projects/new?error=industry");
  }
  if (!businessName) {
    redirect("/projects/new?error=name");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      industry,
      business_name: businessName,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/projects/new?error=create");
  }

  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}
