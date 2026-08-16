import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProgressChart } from "@/components/ProgressChart";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await requireTrainer();
  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) notFound();

  const { data: logs } = await supabase
    .from("exercise_logs")
    .select(
      `logged_at, weight, reps, comment, used_alternative,
       routine_exercise:routine_exercises (
         exercise:exercises ( id, name )
       )`
    )
    .eq("client_id", clientId)
    .order("logged_at", { ascending: true });

  const byExercise = new Map<
    string,
    { name: string; points: { date: string; weight: number; reps: number | null }[] }
  >();
  for (const log of logs ?? []) {
    const re = Array.isArray(log.routine_exercise)
      ? log.routine_exercise[0]
      : log.routine_exercise;
    const exercise = Array.isArray(re?.exercise) ? re?.exercise[0] : re?.exercise;
    if (!exercise || log.weight == null) continue;
    const entry = byExercise.get(exercise.id) ?? {
      name: exercise.name,
      points: [] as { date: string; weight: number; reps: number | null }[],
    };
    entry.points.push({
      date: new Date(log.logged_at).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
      }),
      weight: Number(log.weight),
      reps: log.reps == null ? null : Number(log.reps),
    });
    byExercise.set(exercise.id, entry);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{client.full_name}</h1>
          <p className="text-sm text-neutral-500">{client.email}</p>
        </div>
        <Link
          href={`/trainer/clientes/${client.id}/rutina`}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500"
        >
          Editar rutina
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold">Progreso</h2>
        <div className="flex flex-col gap-4">
          {[...byExercise.values()].map((ex) => (
            <div
              key={ex.name}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
            >
              <p className="mb-2 font-medium">{ex.name}</p>
              <ProgressChart data={ex.points} />
            </div>
          ))}
          {byExercise.size === 0 && (
            <p className="text-neutral-400">Todavía no cargó registros.</p>
          )}
        </div>
      </section>
    </div>
  );
}
