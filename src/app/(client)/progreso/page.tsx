import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProgressChart } from "@/components/ProgressChart";

export default async function ProgresoPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("exercise_logs")
    .select(
      `logged_at, weight, reps,
       routine_exercise:routine_exercises (
         exercise:exercises ( id, name )
       )`
    )
    .eq("client_id", profile.id)
    .order("logged_at", { ascending: true });

  const byExercise = new Map<
    string,
    { name: string; points: { date: string; weight: number }[] }
  >();

  for (const log of logs ?? []) {
    const re = Array.isArray(log.routine_exercise)
      ? log.routine_exercise[0]
      : log.routine_exercise;
    const exercise = Array.isArray(re?.exercise) ? re?.exercise[0] : re?.exercise;
    if (!exercise || log.weight == null) continue;

    const entry = byExercise.get(exercise.id) ?? {
      name: exercise.name,
      points: [] as { date: string; weight: number }[],
    };
    entry.points.push({
      date: new Date(log.logged_at).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
      }),
      weight: Number(log.weight),
    });
    byExercise.set(exercise.id, entry);
  }

  const exercises = [...byExercise.values()];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Tu progreso</h1>

      {exercises.length === 0 && (
        <p className="text-neutral-400">
          Todavía no cargaste ningún registro. Empezá desde &quot;Mi semana&quot;.
        </p>
      )}

      {exercises.map((ex) => (
        <div
          key={ex.name}
          className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
        >
          <p className="mb-2 font-medium">{ex.name}</p>
          <ProgressChart data={ex.points} />
        </div>
      ))}
    </div>
  );
}
