import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAutomationAuth } from "@/lib/automationAuth";

export async function GET(request: NextRequest) {
  const authError = checkAutomationAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, instructions")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exercises: data });
}

export async function POST(request: NextRequest) {
  const authError = checkAutomationAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "Falta 'name'." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      name: body.name,
      muscle_group: body.muscle_group ?? null,
      instructions: body.instructions ?? null,
    })
    .select("id, name, muscle_group, instructions")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exercise: data }, { status: 201 });
}
