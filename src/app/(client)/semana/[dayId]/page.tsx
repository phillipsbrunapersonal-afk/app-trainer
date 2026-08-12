import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logExercise } from "./actions";

export default async function DayPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: day } = await supabase
    .from("routine_days")
    .select("id, day_number, label, routine_id")
    .eq("id", dayId)
    .maybeSingle();

  if (!day) notFound();

  const { data: routineExercises } = await supabase
    .from("routine_exercises")
    .select(
      `id, order_index, target_sets, target_reps,
       exercise:exercises!routine_exercises_exercise_id_fkey (
         id, name, muscle_group,
         alternative:exercises!exercises_alternative_exercise_id_fkey ( id, name )
       )`
    )
    .eq("routine_day_id", dayId)
    .order("order_index", { ascending: true });

  const exerciseIds = (routineExercises ?? []).map((re) => re.id);

  type LastLog = {
    routine_exercise_id: string;
    weight: number | null;
    reps: number | null;
    comment: string | null;
    logged_at: string;
  };

  const { data: lastLogs }: { data: LastLog[] | null } = exerciseIds.length
    ? await supabase
        .from("exercise_logs")
        .select("routine_exercise_id, weight, reps, comment, logged_at")
        .eq("client_id", profile.id)
        .in("routine_exercise_id", exerciseIds)
        .order("logged_at", { ascending: false })
    : { data: [] };

  const lastLogByExercise = new Map<string, LastLog>();
  for (const log of lastLogs ?? []) {
    if (!lastLogByExercise.has(log.routine_exercise_id)) {
      lastLogByExercise.set(log.routine_exercise_id, log);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">
        Día {day.day_number}
        {day.label ? ` · ${day.label}` : ""}
      </h1>

      {(routineExercises ?? []).map((re, idx) => {
        const exercise = Array.isArray(re.exercise) ? re.exercise[0] : re.exercise;
        const alternative = Array.isArray(exercise?.alternative)
          ? exercise?.alternative[0]
          : exercise?.alternative;
        const lastLog = lastLogByExercise.get(re.id);

        return (
          <div
            key={re.id}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
          >
            <p className="font-medium">
              {idx + 1}. {exercise?.name}
            </p>
            <p className="mb-3 text-sm text-neutral-400">
              Objetivo: {re.target_sets ?? "—"} series x {re.target_reps ?? "—"} reps
              {exercise?.muscle_group ? ` · ${exercise.muscle_group}` : ""}
            </p>

            {lastLog && (
              <p className="mb-3 text-xs text-neutral-500">
                Último registro: {lastLog.weight ?? "—"} kg x {lastLog.reps ?? "—"} rep
                {lastLog.comment ? ` (${lastLog.comment})` : ""}
              </p>
            )}

            <form action={logExercise} className="flex flex-col gap-2">
              <input type="hidden" name="routine_exercise_id" value={re.id} />
              <input type="hidden" name="day_id" value={day.id} />

              <div className="flex gap-2">
                <input
                  name="weight"
                  type="number"
                  step="0.5"
                  placeholder="Peso (kg)"
                  className="w-1/2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
                />
                <input
                  name="reps"
                  type="number"
                  placeholder="Reps"
                  className="w-1/2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
                />
              </div>

              <input
                name="comment"
                type="text"
                placeholder="Comentario (opcional)"
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
              />

              {alternative && (
                <label className="flex items-center gap-2 text-sm text-neutral-400">
                  <input type="checkbox" name="used_alternative" />
                  No tenía el equipo, usé la alternativa: {alternative.name}
                </label>
              )}

              <button
                type="submit"
                className="mt-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500"
              >
                Guardar
              </button>
            </form>
          </div>
        );
      })}

      {(routineExercises ?? []).length === 0 && (
        <p className="text-neutral-400">Este día todavía no tiene ejercicios.</p>
      )}
    </div>
  );
}
