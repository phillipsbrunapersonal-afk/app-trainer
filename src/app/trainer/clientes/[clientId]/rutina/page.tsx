import { notFound } from "next/navigation";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  createRoutine,
  addDay,
  removeDay,
  addExerciseToDay,
  removeExerciseFromDay,
} from "./actions";

export default async function RutinaPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await requireTrainer();
  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", clientId)
    .maybeSingle();
  if (!client) notFound();

  const { data: routine } = await supabase
    .from("routines")
    .select("id, name")
    .eq("client_id", clientId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name")
    .order("name", { ascending: true });

  if (!routine) {
    return (
      <div className="max-w-sm">
        <h1 className="mb-3 text-lg font-semibold">
          Rutina de {client.full_name}
        </h1>
        <p className="mb-4 text-neutral-400">
          Este cliente todavía no tiene una rutina activa.
        </p>
        <form action={createRoutine} className="flex flex-col gap-2">
          <input type="hidden" name="client_id" value={clientId} />
          <input
            name="name"
            placeholder="Nombre de la rutina"
            defaultValue="Rutina semanal"
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500"
          >
            Crear rutina
          </button>
        </form>
      </div>
    );
  }

  const { data: days } = await supabase
    .from("routine_days")
    .select(
      `id, day_number, label,
       routine_exercises (
         id, order_index, target_sets, target_reps,
         exercise:exercises!routine_exercises_exercise_id_fkey ( id, name )
       )`
    )
    .eq("routine_id", routine.id)
    .order("day_number", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">{routine.name} · {client.full_name}</h1>

      {(days ?? []).map((day) => (
        <div
          key={day.id}
          className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium">
              Día {day.day_number}
              {day.label ? ` · ${day.label}` : ""}
            </p>
            <form action={removeDay}>
              <input type="hidden" name="day_id" value={day.id} />
              <input type="hidden" name="client_id" value={clientId} />
              <button className="text-xs text-red-400 hover:text-red-300" type="submit">
                Eliminar día
              </button>
            </form>
          </div>

          <ul className="mb-3 flex flex-col gap-1">
            {(day.routine_exercises ?? [])
              .sort((a, b) => a.order_index - b.order_index)
              .map((re) => {
                const ex = Array.isArray(re.exercise) ? re.exercise[0] : re.exercise;
                return (
                  <li
                    key={re.id}
                    className="flex items-center justify-between rounded-lg bg-neutral-800 px-3 py-2 text-sm"
                  >
                    <span>
                      {ex?.name} — {re.target_sets ?? "—"}x{re.target_reps ?? "—"}
                    </span>
                    <form action={removeExerciseFromDay}>
                      <input type="hidden" name="routine_exercise_id" value={re.id} />
                      <input type="hidden" name="client_id" value={clientId} />
                      <button className="text-xs text-red-400 hover:text-red-300" type="submit">
                        Quitar
                      </button>
                    </form>
                  </li>
                );
              })}
          </ul>

          <form action={addExerciseToDay} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="day_id" value={day.id} />
            <input type="hidden" name="client_id" value={clientId} />
            <input
              type="hidden"
              name="order_index"
              value={(day.routine_exercises ?? []).length}
            />
            <select
              name="exercise_id"
              required
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
            >
              {(exercises ?? []).map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
            <input
              name="target_sets"
              type="number"
              placeholder="Series"
              className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
            />
            <input
              name="target_reps"
              placeholder="Reps"
              className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
            >
              Agregar
            </button>
          </form>
        </div>
      ))}

      <div className="max-w-sm rounded-xl border border-dashed border-neutral-700 p-4">
        <p className="mb-2 text-sm font-medium">Agregar día</p>
        <form action={addDay} className="flex items-center gap-2">
          <input type="hidden" name="routine_id" value={routine.id} />
          <input type="hidden" name="client_id" value={clientId} />
          <input
            name="day_number"
            type="number"
            placeholder="N°"
            required
            className="w-16 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
          />
          <input
            name="label"
            placeholder="Nombre (opcional)"
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
          >
            Agregar
          </button>
        </form>
      </div>
    </div>
  );
}
