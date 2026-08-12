import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
        <h1 className="mb-1 text-xl font-semibold text-white">
          Mis Rutinas
        </h1>
        <p className="mb-6 text-sm text-neutral-400">
          Ingresá con la cuenta que te creó tu entrenador/a.
        </p>

        <form action={login} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-neutral-300" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white transition hover:bg-emerald-500"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
