import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createClientAccount } from "./clientes/actions";

export default async function TrainerDashboard() {
  await requireTrainer();
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "client")
    .order("full_name", { ascending: true });

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="mb-3 text-lg font-semibold">Clientes</h1>
        <div className="flex flex-col gap-2">
          {(clients ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/trainer/clientes/${c.id}`}
              className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-emerald-600"
            >
              <span>{c.full_name}</span>
              <span className="text-sm text-neutral-500">{c.email}</span>
            </Link>
          ))}
          {(clients ?? []).length === 0 && (
            <p className="text-neutral-400">Todavía no diste de alta ningún cliente.</p>
          )}
        </div>
      </section>

      <section className="max-w-sm">
        <h2 className="mb-3 text-base font-semibold">Dar de alta un cliente</h2>
        <form action={createClientAccount} className="flex flex-col gap-2">
          <input
            name="full_name"
            placeholder="Nombre y apellido"
            required
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500"
          >
            Crear cuenta
          </button>
          <p className="text-xs text-neutral-500">
            Le va a llegar un email para elegir su contraseña.
          </p>
        </form>
      </section>
    </div>
  );
}
