import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChatThread } from "@/components/ChatThread";

export default async function ChatPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: trainer } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "trainer")
    .limit(1)
    .maybeSingle();

  if (!trainer) {
    return <p className="text-neutral-400">Todavía no hay un entrenador configurado.</p>;
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at")
    .or(
      `and(sender_id.eq.${profile.id},receiver_id.eq.${trainer.id}),and(sender_id.eq.${trainer.id},receiver_id.eq.${profile.id})`
    )
    .order("created_at", { ascending: true });

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <h1 className="mb-2 text-lg font-semibold">Chat con {trainer.full_name}</h1>
      <ChatThread
        currentUserId={profile.id}
        otherUserId={trainer.id}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
