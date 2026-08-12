import Link from "next/link";
import { requireTrainer } from "@/lib/auth";
import { logout } from "@/app/login/actions";

const NAV = [
  { href: "/trainer", label: "Clientes" },
  { href: "/trainer/ejercicios", label: "Ejercicios" },
  { href: "/trainer/chat", label: "Chat" },
  { href: "/trainer/faq", label: "FAQ" },
];

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireTrainer();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Panel entrenador/a</span>
          <nav className="flex gap-4 text-sm text-neutral-400">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-400">{profile.full_name}</span>
          <form action={logout}>
            <button className="text-sm text-neutral-400 hover:text-white" type="submit">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
