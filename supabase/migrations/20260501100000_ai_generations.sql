-- Contador de gerações de imagem com IA por evento (limite por evento)
alter table public.events
  add column if not exists ai_generations_used int not null default 0;
