import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { logout } from "@/app/login/actions";

const NAV = [
  { href: "/semana", label: "Mi semana", icon: "📅" },
  { href: "/progreso", label: "Progreso", icon: "📈" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/faq", label: "Ayuda", icon: "❓" },
];

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  if (profile.role === "trainer") {
    // El trainer también puede navegar la vista de cliente si hace falta,
    // pero por defecto vive en /trainer.
  }

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <span className="font-semibold">Hola, {profile.full_name.split(" ")[0]}</span>
        <form action={logout}>
          <button className="text-sm text-neutral-400 hover:text-white" type="submit">
            Salir
          </button>
        </form>
      </header>

      <main className="flex-1 px-4 py-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-4 border-t border-neutral-800 bg-neutral-950">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 py-2 text-xs text-neutral-400 hover:text-white"
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
