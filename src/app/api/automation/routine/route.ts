import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAutomationAuth } from "@/lib/automationAuth";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function getClientByEmail(supabase: SupabaseAdmin, email: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("email", email)
    .eq("role", "client")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function getActiveRoutine(supabase: SupabaseAdmin, clientId: string) {
  const { data, error } = await supabase
    .from("routines")
    .select("id, name")
    .eq("client_id", clientId)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function GET(request: NextRequest) {
  const authError = checkAutomationAuth(request);
  if (authError) return authError;

  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Falta el parámetro 'email'." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const client = await getClientByEmail(supabase, email).catch((e) => {
    throw e;
  });
  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  let routine = await getActiveRoutine(supabase, client.id);
  if (!routine) {
    return NextResponse.json({ client, routine: null, days: [] });
  }

  const { data: days } = await supabase
    .from("routine_days")
    .select("id, day_number, label")
    .eq("routine_id", routine.id)
    .order("day_number", { ascending: true });

  const result = [];
  for (const day of days ?? []) {
    const { data: items } = await supabase
      .from("routine_exercises")
      .select(
        `id, order_index, target_sets, target_reps,
         exercise:exercises!exercise_id ( id, name, muscle_group, instructions )`
      )
      .eq("routine_day_id", day.id)
      .order("order_index", { ascending: true });

    const { data: logs } = await supabase
      .from("exercise_logs")
      .select("routine_exercise_id, weight, reps, comment, logged_at")
      .eq("client_id", client.id)
      .in("routine_exercise_id", (items ?? []).map((i) => i.id))
      .order("logged_at", { ascending: false });

    type LogRow = {
      routine_exercise_id: string;
      weight: number | null;
      reps: number | null;
      comment: string | null;
      logged_at: string;
    };
    const lastLogByExercise = new Map<string, LogRow>();
    for (const log of logs ?? []) {
      if (!lastLogByExercise.has(log.routine_exercise_id)) {
        lastLogByExercise.set(log.routine_exercise_id, log);
      }
    }

    result.push({
      day_number: day.day_number,
      label: day.label,
      exercises: (items ?? []).map((i) => {
        const exercise = Array.isArray(i.exercise) ? i.exercise[0] : i.exercise;
        const lastLog = lastLogByExercise.get(i.id);
        return {
          name: exercise?.name,
          muscle_group: exercise?.muscle_group,
          target_sets: i.target_sets,
          target_reps: i.target_reps,
          last_log: lastLog
            ? {
                weight: lastLog.weight,
                reps: lastLog.reps,
                comment: lastLog.comment,
                logged_at: lastLog.logged_at,
              }
            : null,
        };
      }),
    });
  }

  return NextResponse.json({ client, routine, days: result });
}

type IncomingExercise = {
  name: string;
  muscle_group?: string | null;
  instructions?: string | null;
  target_sets?: number | null;
  target_reps?: string | null;
  log?: {
    weight?: number | null;
    reps?: number | null;
    comment?: string | null;
    logged_at?: string | null;
    executed?: boolean;
  } | null;
};

type IncomingDay = {
  day_number: number;
  label?: string | null;
  exercises: IncomingExercise[];
};

export async function PUT(request: NextRequest) {
  const authError = checkAutomationAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const clientEmail: string | undefined = body?.client_email;
  const days: IncomingDay[] | undefined = body?.days;

  if (!clientEmail || !Array.isArray(days) || days.length === 0) {
    return NextResponse.json(
      { error: "Body inválido. Se requiere 'client_email' y 'days' (array no vacío)." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const client = await getClientByEmail(supabase, clientEmail);
  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  let routine = await getActiveRoutine(supabase, client.id);
  if (!routine) {
    const { data: newRoutine, error } = await supabase
      .from("routines")
      .insert({ client_id: client.id, name: "Rutina semanal", active: true })
      .select("id, name")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    routine = newRoutine;
  }

  const { data: catalog } = await supabase.from("exercises").select("id, name");
  const exerciseIdByName = new Map((catalog ?? []).map((e) => [e.name, e.id]));

  const resolveExerciseId = async (item: IncomingExercise) => {
    const existing = exerciseIdByName.get(item.name);
    if (existing) return existing;

    // Ejercicio no existe en el catálogo: lo creamos si vino con datos suficientes.
    const { data: created, error } = await supabase
      .from("exercises")
      .insert({
        name: item.name,
        muscle_group: item.muscle_group ?? null,
        instructions: item.instructions ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(`No se pudo crear el ejercicio "${item.name}": ${error.message}`);
    exerciseIdByName.set(item.name, created.id);
    return created.id;
  };

  const summary: { day_number: number; label: string | null; exercises: number }[] = [];

  for (const day of days) {
    if (!day.day_number || !Array.isArray(day.exercises)) {
      return NextResponse.json(
        { error: `Día inválido: falta 'day_number' o 'exercises'.` },
        { status: 400 }
      );
    }

    const { data: existingDay } = await supabase
      .from("routine_days")
      .select("id")
      .eq("routine_id", routine.id)
      .eq("day_number", day.day_number)
      .maybeSingle();

    let dayId: string;
    if (existingDay) {
      dayId = existingDay.id;
      if (day.label != null) {
        await supabase.from("routine_days").update({ label: day.label }).eq("id", dayId);
      }
    } else {
      const { data: newDay, error } = await supabase
        .from("routine_days")
        .insert({ routine_id: routine.id, day_number: day.day_number, label: day.label ?? "" })
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      dayId = newDay.id;
    }

    // Reconciliar en vez de borrar-y-recrear: así no se pierde el historial de
    // exercise_logs (que depende de routine_exercises con on delete cascade)
    // cuando solo cambia el peso/reps objetivo de un ejercicio que ya estaba.
    const { data: currentRows } = await supabase
      .from("routine_exercises")
      .select("id, exercise_id")
      .eq("routine_day_id", dayId);
    const remainingCurrentRows = new Map((currentRows ?? []).map((r) => [r.id, r.exercise_id]));
    const usedRowIds = new Set<string>();

    for (let i = 0; i < day.exercises.length; i++) {
      const item = day.exercises[i];
      if (!item.name) {
        return NextResponse.json({ error: "Cada ejercicio necesita 'name'." }, { status: 400 });
      }

      const exerciseId = await resolveExerciseId(item);

      // Reutilizar una fila existente del mismo ejercicio en este día si hay una libre
      // (preserva el id y por lo tanto el historial de logs ya asociado).
      let rowId: string | null = null;
      for (const [id, exId] of remainingCurrentRows) {
        if (exId === exerciseId && !usedRowIds.has(id)) {
          rowId = id;
          break;
        }
      }

      if (rowId) {
        usedRowIds.add(rowId);
        const { error: updErr } = await supabase
          .from("routine_exercises")
          .update({
            order_index: i,
            target_sets: item.target_sets ?? null,
            target_reps: item.target_reps ?? null,
          })
          .eq("id", rowId);
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      } else {
        const { data: re, error: reErr } = await supabase
          .from("routine_exercises")
          .insert({
            routine_day_id: dayId,
            exercise_id: exerciseId,
            order_index: i,
            target_sets: item.target_sets ?? null,
            target_reps: item.target_reps ?? null,
          })
          .select("id")
          .single();
        if (reErr) return NextResponse.json({ error: reErr.message }, { status: 500 });
        rowId = re.id as string;
        usedRowIds.add(rowId);
      }

      if (item.log && item.log.executed !== false) {
        const { error: logErr } = await supabase.from("exercise_logs").insert({
          client_id: client.id,
          routine_exercise_id: rowId,
          logged_at: item.log.logged_at ?? new Date().toISOString(),
          weight: item.log.weight ?? null,
          reps: item.log.reps ?? null,
          comment: item.log.comment ?? null,
        });
        if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });
      }
    }

    // Filas que quedaron sin usar (ejercicios que ya no están en el plan de este día): borrar.
    const rowIdsToDelete = [...remainingCurrentRows.keys()].filter((id) => !usedRowIds.has(id));
    if (rowIdsToDelete.length > 0) {
      await supabase.from("routine_exercises").delete().in("id", rowIdsToDelete);
    }

    summary.push({ day_number: day.day_number, label: day.label ?? null, exercises: day.exercises.length });
  }

  return NextResponse.json({ client, routine, updated: summary });
}
