import { requireTrainer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createFaq, deleteFaq } from "./actions";

export default async function TrainerFaqPage() {
  await requireTrainer();
  const supabase = await createClient();

  const { data: faqs } = await supabase
    .from("faqs")
    .select("id, question, answer")
    .order("order_index", { ascending: true });

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="mb-3 text-lg font-semibold">Preguntas frecuentes</h1>
        <div className="flex flex-col gap-2">
          {(faqs ?? []).map((faq) => (
            <div
              key={faq.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium">{faq.question}</p>
                <form action={deleteFaq}>
                  <input type="hidden" name="id" value={faq.id} />
                  <button className="text-xs text-red-400 hover:text-red-300" type="submit">
                    Eliminar
                  </button>
                </form>
              </div>
              <p className="text-sm text-neutral-400">{faq.answer}</p>
            </div>
          ))}
          {(faqs ?? []).length === 0 && (
            <p className="text-neutral-400">Todavía no cargaste preguntas.</p>
          )}
        </div>
      </section>

      <section className="max-w-md">
        <h2 className="mb-3 text-base font-semibold">Nueva pregunta</h2>
        <form action={createFaq} className="flex flex-col gap-2">
          <input
            name="question"
            placeholder="Pregunta"
            required
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          />
          <textarea
            name="answer"
            placeholder="Respuesta"
            required
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500"
          >
            Guardar
          </button>
        </form>
      </section>
    </div>
  );
}
