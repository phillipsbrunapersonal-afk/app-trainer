import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SemanaPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: routine } = await supabase
    .from("routines")
    .select("id, name")
    .eq("client_id", profile.id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!routine) {
    return (
      <p className="text-neutral-400">
        Todavía no tenés una rutina activa. Escribile a tu entrenador/a desde
        el chat para que te la asigne.
      </p>
    );
  }

  const { data: days } = await supabase
    .from("routine_days")
    .select("id, day_number, label")
    .eq("routine_id", routine.id)
    .order("day_number", { ascending: true });

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-semibold">{routine.name}</h1>
      {(days ?? []).map((day) => (
        <Link
          key={day.id}
          href={`/semana/${day.id}`}
          className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-emerald-600"
        >
          <span>
            Día {day.day_number}
            {day.label ? ` · ${day.label}` : ""}
          </span>
          <span className="text-neutral-500">→</span>
        </Link>
      ))}
      {(days ?? []).length === 0 && (
        <p className="text-neutral-400">
          Tu rutina todavía no tiene días cargados.
        </p>
      )}
    </div>
  );
}
