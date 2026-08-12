"use server";

import { revalidatePath } from "next/cache";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createRoutine(formData: FormData) {
  await requireTrainer();
  const supabase = await createClient();
  const clientId = String(formData.get("client_id"));
  const name = String(formData.get("name") ?? "Rutina semanal").trim();

  await supabase.from("routines").insert({ client_id: clientId, name });
  revalidatePath(`/trainer/clientes/${clientId}/rutina`);
}

export async function addDay(formData: FormData) {
  await requireTrainer();
  const supabase = await createClient();
  const routineId = String(formData.get("routine_id"));
  const clientId = String(formData.get("client_id"));
  const dayNumber = Number(formData.get("day_number"));
  const label = String(formData.get("label") ?? "").trim();

  await supabase
    .from("routine_days")
    .insert({ routine_id: routineId, day_number: dayNumber, label });
  revalidatePath(`/trainer/clientes/${clientId}/rutina`);
}

export async function removeDay(formData: FormData) {
  await requireTrainer();
  const supabase = await createClient();
  const dayId = String(formData.get("day_id"));
  const clientId = String(formData.get("client_id"));

  await supabase.from("routine_days").delete().eq("id", dayId);
  revalidatePath(`/trainer/clientes/${clientId}/rutina`);
}

export async function addExerciseToDay(formData: FormData) {
  await requireTrainer();
  const supabase = await createClient();
  const dayId = String(formData.get("day_id"));
  const clientId = String(formData.get("client_id"));
  const exerciseId = String(formData.get("exercise_id"));
  const targetSets = formData.get("target_sets");
  const targetReps = String(formData.get("target_reps") ?? "").trim();
  const orderIndex = Number(formData.get("order_index") ?? 0);

  await supabase.from("routine_exercises").insert({
    routine_day_id: dayId,
    exercise_id: exerciseId,
    target_sets: targetSets ? Number(targetSets) : null,
    target_reps: targetReps || null,
    order_index: orderIndex,
  });
  revalidatePath(`/trainer/clientes/${clientId}/rutina`);
}

export async function removeExerciseFromDay(formData: FormData) {
  await requireTrainer();
  const supabase = await createClient();
  const routineExerciseId = String(formData.get("routine_exercise_id"));
  const clientId = String(formData.get("client_id"));

  await supabase.from("routine_exercises").delete().eq("id", routineExerciseId);
  revalidatePath(`/trainer/clientes/${clientId}/rutina`);
}
