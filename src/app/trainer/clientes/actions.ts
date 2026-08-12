"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireTrainer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createClientAccount(formData: FormData) {
  await requireTrainer();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!fullName || !email) return;

  const admin = createAdminClient();
  const tempPassword = randomBytes(9).toString("base64url");

  await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  // Dispara el email de "recuperar contraseña" de Supabase para que el
  // cliente elija su propia contraseña la primera vez que entra.
  await admin.auth.resetPasswordForEmail(email);

  revalidatePath("/trainer");
}
