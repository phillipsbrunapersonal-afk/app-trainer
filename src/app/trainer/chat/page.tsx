import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function TrainerChatInbox() {
  const trainer = await requireTrainer();
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "client")
    .order("full_name", { ascending: true });

  const { data: lastMessages } = await supabase
    .from("messages")
    .select("sender_id, receiver_id, content, created_at")
    .or(`sender_id.eq.${trainer.id},receiver_id.eq.${trainer.id}`)
    .order("created_at", { ascending: false });

  const lastByClient = new Map<string, { content: string; created_at: string }>();
  for (const m of lastMessages ?? []) {
    const clientId = m.sender_id === trainer.id ? m.receiver_id : m.sender_id;
    if (!lastByClient.has(clientId)) {
      lastByClient.set(clientId, { content: m.content, created_at: m.created_at });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="mb-2 text-lg font-semibold">Chat</h1>
      {(clients ?? []).map((c) => {
        const last = lastByClient.get(c.id);
        return (
          <Link
            key={c.id}
            href={`/trainer/chat/${c.id}`}
            className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-emerald-600"
          >
            <span>{c.full_name}</span>
            <span className="max-w-[50%] truncate text-sm text-neutral-500">
              {last?.content ?? "Sin mensajes"}
            </span>
          </Link>
        );
      })}
      {(clients ?? []).length === 0 && (
        <p className="text-neutral-400">Todavía no tenés clientes.</p>
      )}
    </div>
  );
}
