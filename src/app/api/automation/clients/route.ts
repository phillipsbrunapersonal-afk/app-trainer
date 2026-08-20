import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAutomationAuth, corsJson, corsPreflight } from "@/lib/automationAuth";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: NextRequest) {
  const authError = checkAutomationAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "client")
    .order("full_name", { ascending: true });

  if (error) {
    return corsJson({ error: error.message }, { status: 500 });
  }

  return corsJson({ clients: data });
}

export async function POST(request: NextRequest) {
  const authError = checkAutomationAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const fullName: string | undefined = body?.full_name?.trim();
  const email: string | undefined = body?.email?.trim();

  if (!fullName || !email) {
    return corsJson({ error: "Se requiere 'full_name' y 'email'." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Mismo flujo que usa el panel del entrenador: se crea el usuario con una
  // contraseña temporal aleatoria y se dispara el email de "elegí tu
  // contraseña" (reset) para que el cliente la establezca él mismo.
  const tempPassword = crypto.randomUUID();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    const status = /already.*registered|already exists/i.test(error.message) ? 409 : 500;
    return corsJson({ error: error.message }, { status });
  }

  await admin.auth.resetPasswordForEmail(email);

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", created.user.id)
    .maybeSingle();

  return corsJson(
    { client: profile ?? { id: created.user.id, full_name: fullName, email } },
    { status: 201 }
  );
}
