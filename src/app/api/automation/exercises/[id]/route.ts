import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAutomationAuth, corsJson, corsPreflight } from "@/lib/automationAuth";

export async function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAutomationAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || (body.name === undefined && body.muscle_group === undefined && body.instructions === undefined)) {
    return corsJson(
      { error: "Nada para actualizar. Mandá 'name', 'muscle_group' y/o 'instructions'." },
      { status: 400 }
    );
  }

  const update: Record<string, string | null> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.muscle_group !== undefined) update.muscle_group = body.muscle_group;
  if (body.instructions !== undefined) update.instructions = body.instructions;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("exercises")
    .update(update)
    .eq("id", id)
    .select("id, name, muscle_group, instructions")
    .maybeSingle();

  if (error) {
    return corsJson({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return corsJson({ error: "Ejercicio no encontrado." }, { status: 404 });
  }

  return corsJson({ exercise: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAutomationAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase.from("exercises").delete().eq("id", id).select("id");

  if (error) {
    // El ejercicio está en uso en alguna rutina (foreign key) — no se puede borrar.
    if (error.code === "23503") {
      return corsJson(
        { error: "No se puede borrar: el ejercicio está usado en una o más rutinas." },
        { status: 409 }
      );
    }
    return corsJson({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return corsJson({ error: "Ejercicio no encontrado." }, { status: 404 });
  }

  return corsJson({ deleted: true });
}
