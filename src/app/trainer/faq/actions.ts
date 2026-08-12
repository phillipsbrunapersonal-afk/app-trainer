"use server";

import { revalidatePath } from "next/cache";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createFaq(formData: FormData) {
  await requireTrainer();
  const supabase = await createClient();

  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return;

  const { count } = await supabase
    .from("faqs")
    .select("id", { count: "exact", head: true });

  await supabase.from("faqs").insert({
    question,
    answer,
    order_index: count ?? 0,
  });

  revalidatePath("/trainer/faq");
  revalidatePath("/faq");
}

export async function deleteFaq(formData: FormData) {
  await requireTrainer();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase.from("faqs").delete().eq("id", id);

  revalidatePath("/trainer/faq");
  revalidatePath("/faq");
}
