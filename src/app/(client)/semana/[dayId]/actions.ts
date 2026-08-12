"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function logExercise(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const routineExerciseId = String(formData.get("routine_exercise_id"));
  const dayId = String(formData.get("day_id"));
  const weightRaw = formData.get("weight");
  const repsRaw = formData.get("reps");
  const comment = String(formData.get("comment") ?? "").trim();
  const usedAlternative = formData.get("used_alternative") === "on";

  await supabase.from("exercise_logs").insert({
    client_id: profile.id,
    routine_exercise_id: routineExerciseId,
    weight: weightRaw ? Number(weightRaw) : null,
    reps: repsRaw ? Number(repsRaw) : null,
    comment: comment || null,
    used_alternative: usedAlternative,
  });

  revalidatePath(`/semana/${dayId}`);
}
