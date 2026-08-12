import { notFound } from "next/navigation";
import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChatThread } from "@/components/ChatThread";

export default async function TrainerChatWithClient({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const trainer = await requireTrainer();
  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", clientId)
    .maybeSingle();
  if (!client) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at")
    .or(
      `and(sender_id.eq.${trainer.id},receiver_id.eq.${clientId}),and(sender_id.eq.${clientId},receiver_id.eq.${trainer.id})`
    )
    .order("created_at", { ascending: true });

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="mb-2 text-lg font-semibold">Chat con {client.full_name}</h1>
      <ChatThread
        currentUserId={trainer.id}
        otherUserId={clientId}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
