-- Limite de gerações de IA por evento agora é configurável (admin pode liberar mais)
-- e o anfitrião pode solicitar um aumento.
alter table public.events
  add column if not exists ai_generations_limit int not null default 5,
  add column if not exists ai_extra_requested_at timestamptz;

-- Eventos com pedido de mais créditos pendente (pro painel admin)
create index if not exists events_ai_extra_requested_idx
  on public.events (ai_extra_requested_at)
  where ai_extra_requested_at is not null;
