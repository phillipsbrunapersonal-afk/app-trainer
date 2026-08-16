import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createExercise, deleteExercise } from "./actions";

export default async function EjerciciosPage() {
  await requireTrainer();
  const supabase = await createClient();

  const { data: exercises, error: exercisesError } = await supabase
    .from("exercises")
    .select(
      "id, name, muscle_group, instructions, alternative:exercises!alternative_exercise_id(name)"
    )
    .order("name", { ascending: true });

  if (exercisesError) {
    console.error("EjerciciosPage select error:", exercisesError);
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="mb-3 text-lg font-semibold">Catálogo de ejercicios</h1>
        <div className="flex flex-col gap-2">
          {(exercises ?? []).map((ex) => {
            const alt = Array.isArray(ex.alternative) ? ex.alternative[0] : ex.alternative;
            return (
              <div
                key={ex.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ex.name}</p>
                    <p className="text-sm text-neutral-500">
                      {ex.muscle_group ?? "—"}
                      {alt ? ` · Alternativa: ${alt.name}` : ""}
                    </p>
                  </div>
                  <form action={deleteExercise}>
                    <input type="hidden" name="id" value={ex.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
                {ex.instructions && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-emerald-400 hover:text-emerald-300">
                      Ver detalles
                    </summary>
                    <p className="mt-2 text-sm text-neutral-300">{ex.instructions}</p>
                  </details>
                )}
              </div>
            );
          })}
          {(exercises ?? []).length === 0 && (
            <p className="text-neutral-400">Todavía no cargaste ejercicios.</p>
          )}
        </div>
      </section>

      <section className="max-w-md">
        <h2 className="mb-3 text-base font-semibold">Nuevo ejercicio</h2>
        <form action={createExercise} className="flex flex-col gap-2">
          <input
            name="name"
            placeholder="Nombre (ej: Press mancuernas)"
            required
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
          />
          <input
            name="muscle_group"
            placeholder="Grupo muscular (opcional)"
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
          />
          <textarea
            name="instructions"
            placeholder="Instrucciones (opcional)"
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
          />
          <select
            name="alternative_exercise_id"
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
            defaultValue=""
          >
            <option value="">Sin alternativa</option>
            {(exercises ?? []).map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500"
          >
            Guardar
          </button>
        </form>
      </section>
    </div>
  );
}
