# Mis Rutinas

App web (PWA) para armar y asignar rutinas de entrenamiento a clientes, que
funciona en cualquier gimnasio. Cada cliente se loguea, ve su rutina semanal,
carga peso/reps/comentarios por ejercicio, ve su progreso histórico, tiene un
chat directo con el entrenador/a y una sección de preguntas frecuentes.

Ver el detalle de arquitectura y decisiones en `PLAN.md` (o en el plan
original de la conversación).

## 1. Crear el proyecto en Supabase

1. Creá una cuenta/proyecto gratis en https://supabase.com.
2. En **SQL Editor**, pegá y ejecutá el contenido de
   `supabase/migrations/0001_init.sql`. Esto crea todas las tablas y las
   políticas de seguridad (RLS).
3. En **Project Settings → API**, copiá:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secreta, solo se usa
     en el servidor para crear cuentas de clientes)

## 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completá `.env.local` con los tres valores de arriba.

## 3. Crear tu cuenta de entrenador/a

1. Corré la app (`npm run dev`) y andá a `/login`. Como todavía no existe tu
   usuario, creálo desde el dashboard de Supabase: **Authentication → Users →
   Add user** (con email + contraseña, marcando "Auto Confirm User").
2. Esto dispara el trigger que crea tu fila en `profiles` con rol `client`
   por defecto. Promoveté a `trainer` corriendo en el SQL Editor:

   ```sql
   update public.profiles set role = 'trainer' where email = 'tu-email@ejemplo.com';
   ```

3. Volvé a loguearte en la app: ahora vas a entrar directo al panel de
   entrenador/a (`/trainer`).

## 4. Correr en desarrollo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000.

## 5. Dar de alta clientes

Desde `/trainer`, usá el formulario "Dar de alta un cliente". Se crea la
cuenta y le llega un email para elegir su contraseña (usa el flujo de
"recuperar contraseña" de Supabase Auth). Para que los emails salgan con tu
dominio/branding, configurá el proveedor SMTP en Supabase (opcional; por
defecto usa el servicio de emails transaccionales de Supabase, con límites
bajos pero suficientes para probar).

## 6. Deploy gratis

- **Frontend**: importá el repo en [Vercel](https://vercel.com), cargá las
  mismas variables de entorno del paso 2 y deployá. Free tier.
- **Backend**: ya está en Supabase (free tier), no hace falta nada más.

## 7. Instalar como app (PWA)

Desde el navegador del celular (Chrome/Safari), abrí la URL de la app y
elegí "Agregar a pantalla de inicio" / "Instalar app". Queda con ícono
propio y se abre en pantalla completa, sin salir de la tienda de apps.

## Estructura del proyecto

- `src/app/(client)/...` — pantallas del cliente: mi semana, progreso, chat, FAQ.
- `src/app/trainer/...` — panel de administración del entrenador/a.
- `src/lib/supabase/` — clientes de Supabase (browser, server, admin) y middleware de sesión.
- `supabase/migrations/0001_init.sql` — esquema de base de datos + RLS.
- `public/manifest.json`, `public/sw.js` — soporte PWA.
