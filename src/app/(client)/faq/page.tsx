import { createClient } from "@/lib/supabase/server";

export default async function FaqPage() {
  const supabase = await createClient();

  const { data: faqs } = await supabase
    .from("faqs")
    .select("id, question, answer")
    .order("order_index", { ascending: true });

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-semibold">Preguntas frecuentes</h1>

      {(faqs ?? []).map((faq) => (
        <details
          key={faq.id}
          className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
        >
          <summary className="cursor-pointer font-medium">{faq.question}</summary>
          <p className="mt-2 text-sm text-neutral-400">{faq.answer}</p>
        </details>
      ))}

      {(faqs ?? []).length === 0 && (
        <p className="text-neutral-400">Todavía no hay preguntas cargadas.</p>
      )}
    </div>
  );
}
