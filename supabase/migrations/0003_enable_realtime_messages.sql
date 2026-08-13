-- Habilita las actualizaciones en vivo (Realtime) para la tabla de chat.
-- Sin esto, los mensajes se guardan bien pero no aparecen en la otra
-- punta sin recargar la página.
alter publication supabase_realtime add table public.messages;
