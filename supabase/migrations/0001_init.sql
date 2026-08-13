-- Esquema inicial: perfiles, ejercicios, rutinas, registros, chat y FAQ.
-- Pensado para Supabase (Postgres + Auth + RLS).

create extension if not exists pgcrypto;

-- 1. Perfiles (extiende auth.users con rol)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('trainer', 'client')),
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- Crea automáticamente un perfil "client" cuando se crea un usuario en auth.users.
-- El trainer se promueve a mano una sola vez (ver instrucciones al final del archivo).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper: ¿el usuario autenticado es el trainer?
create or replace function public.is_trainer()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'trainer'
  );
$$;

-- 2. Catálogo de ejercicios
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text,
  instructions text,
  alternative_exercise_id uuid references public.exercises (id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3. Rutinas por cliente
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Rutina semanal',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  day_number int not null,
  label text not null default '',
  unique (routine_id, day_number)
);

create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid not null references public.routine_days (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  order_index int not null default 0,
  target_sets int,
  target_reps text
);

-- 4. Registro de entrenamiento (lo que hoy son notas sueltas)
create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  routine_exercise_id uuid not null references public.routine_exercises (id) on delete cascade,
  logged_at timestamptz not null default now(),
  weight numeric,
  reps int,
  comment text,
  used_alternative boolean not null default false
);

-- 5. Chat simple cliente <-> trainer
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- 6. FAQ
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_days enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.messages enable row level security;
alter table public.faqs enable row level security;

-- profiles: cada uno ve su propio perfil, el trainer ve todos, y cualquier
-- usuario logueado puede ver quién es el trainer (lo necesita el chat).
create policy "profiles_select_own_or_trainer" on public.profiles
  for select using (id = auth.uid() or public.is_trainer());
create policy "profiles_select_trainer_is_public" on public.profiles
  for select using (role = 'trainer' and auth.uid() is not null);
create policy "profiles_update_own_or_trainer" on public.profiles
  for update using (id = auth.uid() or public.is_trainer());

-- exercises: catálogo visible para todos los logueados, solo el trainer edita
create policy "exercises_select_all" on public.exercises
  for select using (auth.uid() is not null);
create policy "exercises_write_trainer" on public.exercises
  for all using (public.is_trainer()) with check (public.is_trainer());

-- routines: el cliente ve las suyas, el trainer ve y edita todas
create policy "routines_select_own_or_trainer" on public.routines
  for select using (client_id = auth.uid() or public.is_trainer());
create policy "routines_write_trainer" on public.routines
  for all using (public.is_trainer()) with check (public.is_trainer());

-- routine_days / routine_exercises: siguen el permiso de la rutina padre
create policy "routine_days_select" on public.routine_days
  for select using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and (r.client_id = auth.uid() or public.is_trainer())
    )
  );
create policy "routine_days_write_trainer" on public.routine_days
  for all using (public.is_trainer()) with check (public.is_trainer());

create policy "routine_exercises_select" on public.routine_exercises
  for select using (
    exists (
      select 1 from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = routine_day_id and (r.client_id = auth.uid() or public.is_trainer())
    )
  );
create policy "routine_exercises_write_trainer" on public.routine_exercises
  for all using (public.is_trainer()) with check (public.is_trainer());

-- exercise_logs: el cliente lee/escribe solo lo suyo, el trainer lee todo
create policy "exercise_logs_select_own_or_trainer" on public.exercise_logs
  for select using (client_id = auth.uid() or public.is_trainer());
create policy "exercise_logs_insert_own" on public.exercise_logs
  for insert with check (client_id = auth.uid());
create policy "exercise_logs_update_own" on public.exercise_logs
  for update using (client_id = auth.uid() or public.is_trainer());
create policy "exercise_logs_delete_own_or_trainer" on public.exercise_logs
  for delete using (client_id = auth.uid() or public.is_trainer());

-- messages: cada uno ve los mensajes donde participa
create policy "messages_select_participant" on public.messages
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "messages_insert_as_sender" on public.messages
  for insert with check (sender_id = auth.uid());
create policy "messages_update_participant" on public.messages
  for update using (sender_id = auth.uid() or receiver_id = auth.uid());

-- faqs: lectura para todos los logueados, escritura solo trainer
create policy "faqs_select_all" on public.faqs
  for select using (auth.uid() is not null);
create policy "faqs_write_trainer" on public.faqs
  for all using (public.is_trainer()) with check (public.is_trainer());

-- ---------------------------------------------------------------------
-- Después de correr esta migración y de crear tu propio usuario (vos, el
-- entrenador) desde la app o desde el dashboard de Supabase, promovete a
-- trainer con:
--
--   update public.profiles set role = 'trainer' where email = 'tu-email@ejemplo.com';
-- ---------------------------------------------------------------------
