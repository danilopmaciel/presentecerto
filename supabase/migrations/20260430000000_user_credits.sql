-- Créditos do usuário (gerados quando o anfitrião exclui um evento pago).
-- Ficam disponíveis pra pedir reembolso ou usar em eventos futuros.

create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  reason text not null check (reason in (
    'event_deleted_paid',  -- excluiu evento já pago
    'plan_change_diff',    -- diferença de plano (uso futuro)
    'manual_credit'        -- crédito lançado manualmente pelo admin
  )),
  -- Snapshot do evento de origem (não FK porque evento pode ser excluído depois)
  source_event_id uuid,
  source_event_title text,
  status text not null default 'available' check (status in (
    'available',
    'refund_requested',
    'refunded',
    'used'
  )),
  refund_pix_key text,
  refund_requested_at timestamptz,
  refunded_at timestamptz,
  refund_note text,
  created_at timestamptz not null default now()
);

create index if not exists user_credits_user_idx on public.user_credits(user_id);
create index if not exists user_credits_status_idx on public.user_credits(status);

alter table public.user_credits enable row level security;

drop policy if exists user_credits_owner_all on public.user_credits;
create policy user_credits_owner_all on public.user_credits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
