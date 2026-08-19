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
