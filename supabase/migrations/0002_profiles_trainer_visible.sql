-- Permite que cualquier usuario logueado (clientes) pueda ver el perfil del
-- trainer, dato que necesita el chat para saber con quién hablar.
create policy "profiles_select_trainer_is_public" on public.profiles
  for select using (role = 'trainer' and auth.uid() is not null);
