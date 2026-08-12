"use server";

import { revalidatePath } from "next/cache";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createExercise(formData: FormData) {
  await requireTrainer();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const muscleGroup = String(formData.get("muscle_group") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const alternativeId = String(formData.get("alternative_exercise_id") ?? "");
  if (!name) return;

  const { error } = await supabase.from("exercises").insert({
    name,
    muscle_group: muscleGroup || null,
    instructions: instructions || null,
    alternative_exercise_id: alternativeId || null,
  });

  if (error) {
    console.error("createExercise error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/trainer/ejercicios");
}
