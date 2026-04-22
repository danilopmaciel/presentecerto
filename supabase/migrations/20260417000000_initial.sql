-- =====================================================================
-- PresenteCerto — schema inicial (Fase 1: Pix estático, sem custódia)
-- =====================================================================
-- Aplicar via Supabase SQL Editor ou CLI: `supabase db push`.
-- Premissas: auth.users já existe (gerenciado pelo Supabase Auth).
-- =====================================================================

-- extensões
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  cpf text,
  pix_key text,                         -- chave do anfitrião (Fase 1)
  psp_account_id text,                  -- Fase 2
  kyc_status text not null default 'none' check (kyc_status in ('none','pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- trigger: cria profile automaticamente quando usuário assina
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique not null,
  title text not null,
  description text,
  starts_at timestamptz not null,
  location_text text,
  location_maps_url text,
  cover_image_path text,                -- Supabase Storage path
  theme text not null default 'default',
  status text not null default 'draft' check (status in ('draft','awaiting_payment','published','archived')),

  -- plano pago pelo anfitrião à plataforma
  plan_tier text not null default 'basic' check (plan_tier in ('basic','themed')),
  plan_fee_cents int not null default 2000,  -- R$ 20,00 basic / R$ 50,00 themed
  plan_payment_status text not null default 'pending' check (plan_payment_status in ('pending','paid_claimed','paid','waived')),
  plan_pix_payload text,
  plan_pix_txid text,
  plan_paid_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists events_owner_id_idx on public.events(owner_id);
create index if not exists events_status_idx on public.events(status);
create index if not exists events_starts_at_idx on public.events(starts_at);

-- ---------------------------------------------------------------------
-- gift_items
-- ---------------------------------------------------------------------
create table if not exists public.gift_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text,
  image_path text,
  quota_value_cents int not null check (quota_value_cents > 0),
  quota_total int not null check (quota_total > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gift_items_event_id_idx on public.gift_items(event_id);

-- ---------------------------------------------------------------------
-- rsvps
-- ---------------------------------------------------------------------
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_name text not null,
  guest_email text,
  guest_phone text,
  adults int not null default 1 check (adults >= 0),
  children int not null default 0 check (children >= 0),
  note text,
  status text not null default 'confirmed' check (status in ('confirmed','declined','tentative')),
  created_at timestamptz not null default now()
);

-- nome + email juntos evitam duplicidade amigável
create unique index if not exists rsvps_event_email_uniq
  on public.rsvps(event_id, lower(guest_email))
  where guest_email is not null;

create index if not exists rsvps_event_id_idx on public.rsvps(event_id);

-- ---------------------------------------------------------------------
-- gift_purchases
-- ---------------------------------------------------------------------
create table if not exists public.gift_purchases (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  gift_item_id uuid not null references public.gift_items(id) on delete cascade,
  rsvp_id uuid references public.rsvps(id) on delete set null,
  buyer_name text not null,
  buyer_email text,
  buyer_phone text,
  quotas int not null check (quotas > 0),
  amount_cents int not null check (amount_cents > 0),
  status text not null default 'pending' check (status in ('pending','paid_claimed','paid','expired','refunded')),
  payment_provider text not null default 'static',
  payment_external_id text,
  pix_payload text,
  pix_txid text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists gift_purchases_event_id_idx on public.gift_purchases(event_id);
create index if not exists gift_purchases_gift_item_id_idx on public.gift_purchases(gift_item_id);
create index if not exists gift_purchases_status_idx on public.gift_purchases(status);

-- ---------------------------------------------------------------------
-- outbound_messages (convites e lembretes — Fase 1.5)
-- ---------------------------------------------------------------------
create table if not exists public.outbound_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  rsvp_id uuid references public.rsvps(id) on delete set null,
  channel text not null check (channel in ('whatsapp','email')),
  template text not null check (template in ('invite','reminder_d7','reminder_d2','reminder_d1','thanks')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  status text not null default 'queued' check (status in ('queued','sent','failed','bounced')),
  provider_message_id text,
  error text,
  created_at timestamptz not null default now()
);

create unique index if not exists outbound_messages_unique_per_rsvp_template
  on public.outbound_messages(rsvp_id, template)
  where rsvp_id is not null;

-- ---------------------------------------------------------------------
-- RPC: purchase_quota — reserva quota atomicamente
-- ---------------------------------------------------------------------
-- Uso: select * from public.purchase_quota(p_gift_item_id, p_quotas, p_buyer_name, ...)
-- Garante, via SELECT FOR UPDATE + count consolidado, que não se vende
-- mais cotas do que o disponível mesmo com compras simultâneas.
-- ---------------------------------------------------------------------
create or replace function public.purchase_quota(
  p_gift_item_id uuid,
  p_quotas int,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_rsvp_id uuid,
  p_expires_at timestamptz,
  p_pix_txid text,
  p_pix_payload text
) returns public.gift_purchases
language plpgsql security definer set search_path = public as $$
declare
  v_item public.gift_items%rowtype;
  v_sold int;
  v_purchase public.gift_purchases%rowtype;
begin
  if p_quotas is null or p_quotas <= 0 then
    raise exception 'quotas deve ser > 0';
  end if;

  -- trava a linha do item
  select * into v_item
  from public.gift_items
  where id = p_gift_item_id
  for update;

  if not found then
    raise exception 'gift_item % não encontrado', p_gift_item_id;
  end if;

  -- cotas já vendidas ou reservadas (pending + paid_claimed + paid)
  select coalesce(sum(quotas), 0) into v_sold
  from public.gift_purchases
  where gift_item_id = p_gift_item_id
    and status in ('pending','paid_claimed','paid');

  if v_sold + p_quotas > v_item.quota_total then
    raise exception 'cotas insuficientes (disponíveis: %, pedidas: %)',
      v_item.quota_total - v_sold, p_quotas;
  end if;

  insert into public.gift_purchases(
    event_id, gift_item_id, rsvp_id,
    buyer_name, buyer_email, buyer_phone,
    quotas, amount_cents, status,
    payment_provider, pix_txid, pix_payload,
    expires_at
  ) values (
    v_item.event_id, p_gift_item_id, p_rsvp_id,
    p_buyer_name, p_buyer_email, p_buyer_phone,
    p_quotas, v_item.quota_value_cents * p_quotas, 'pending',
    'static', p_pix_txid, p_pix_payload,
    p_expires_at
  )
  returning * into v_purchase;

  return v_purchase;
end;
$$;

grant execute on function public.purchase_quota(
  uuid, int, text, text, text, uuid, timestamptz, text, text
) to anon, authenticated;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.events            enable row level security;
alter table public.gift_items        enable row level security;
alter table public.rsvps             enable row level security;
alter table public.gift_purchases    enable row level security;
alter table public.outbound_messages enable row level security;

-- profiles: dono vê/edita o seu
drop policy if exists profiles_owner_select on public.profiles;
create policy profiles_owner_select on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles
  for update using (auth.uid() = id);

-- events: dono vê tudo. Público vê eventos com status='published'
drop policy if exists events_owner_all on public.events;
create policy events_owner_all on public.events
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists events_public_read on public.events;
create policy events_public_read on public.events
  for select using (status = 'published');

-- gift_items: dono do evento edita. Público lê se evento é público.
drop policy if exists gift_items_owner_all on public.gift_items;
create policy gift_items_owner_all on public.gift_items
  for all using (
    exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid())
  );

drop policy if exists gift_items_public_read on public.gift_items;
create policy gift_items_public_read on public.gift_items
  for select using (
    exists (select 1 from public.events e where e.id = event_id and e.status = 'published')
  );

-- rsvps: qualquer um pode inserir em evento publicado. Dono do evento lê tudo.
drop policy if exists rsvps_public_insert on public.rsvps;
create policy rsvps_public_insert on public.rsvps
  for insert with check (
    exists (select 1 from public.events e where e.id = event_id and e.status = 'published')
  );

drop policy if exists rsvps_owner_read on public.rsvps;
create policy rsvps_owner_read on public.rsvps
  for select using (
    exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid())
  );

-- gift_purchases: inserção é via RPC (security definer). Só owner lê via RLS.
drop policy if exists gift_purchases_owner_read on public.gift_purchases;
create policy gift_purchases_owner_read on public.gift_purchases
  for select using (
    exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid())
  );

drop policy if exists gift_purchases_owner_update on public.gift_purchases;
create policy gift_purchases_owner_update on public.gift_purchases
  for update using (
    exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid())
  );

-- outbound_messages: só o dono do evento
drop policy if exists outbound_owner_all on public.outbound_messages;
create policy outbound_owner_all on public.outbound_messages
  for all using (
    exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid())
  );

-- =====================================================================
-- STORAGE: bucket público para capas de evento
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do nothing;

-- policies do bucket: qualquer um lê; dono escreve na sua pasta (owner_id/...)
drop policy if exists "event-covers read" on storage.objects;
create policy "event-covers read" on storage.objects
  for select using (bucket_id = 'event-covers');

drop policy if exists "event-covers insert own" on storage.objects;
create policy "event-covers insert own" on storage.objects
  for insert with check (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "event-covers update own" on storage.objects;
create policy "event-covers update own" on storage.objects
  for update using (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "event-covers delete own" on storage.objects;
create policy "event-covers delete own" on storage.objects
  for delete using (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
