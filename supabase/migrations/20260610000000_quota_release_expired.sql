-- Reserva pending expirada não prende cota.
-- 1) purchase_quota passa a ignorar pending vencido na contagem de vendidos
--    (mantém o hardening anterior: evento publicado + clamp do expires_at).
-- 2) índice parcial pra contagem e pro cron de expiração.

create or replace function public.purchase_quota(
  p_gift_item_id uuid, p_quotas integer, p_buyer_name text, p_buyer_email text,
  p_buyer_phone text, p_rsvp_id uuid, p_expires_at timestamp with time zone,
  p_pix_txid text, p_pix_payload text
)
returns gift_purchases
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_item public.gift_items%rowtype;
  v_event public.events%rowtype;
  v_sold int;
  v_expires timestamptz;
  v_purchase public.gift_purchases%rowtype;
begin
  if p_quotas is null or p_quotas <= 0 then
    raise exception 'quotas deve ser > 0';
  end if;

  select * into v_item from public.gift_items where id = p_gift_item_id for update;
  if not found then
    raise exception 'gift_item % nao encontrado', p_gift_item_id;
  end if;

  -- evento precisa estar publicado (bloqueia reserva via RPC direta em rascunho)
  select * into v_event from public.events where id = v_item.event_id;
  if not found or v_event.status <> 'published' then
    raise exception 'evento indisponivel';
  end if;

  -- cotas que realmente prendem estoque: pagas/declaradas, ou pending dentro da validade
  select coalesce(sum(quotas), 0) into v_sold
  from public.gift_purchases
  where gift_item_id = p_gift_item_id
    and (
      status in ('paid_claimed','paid')
      or (status = 'pending' and (expires_at is null or expires_at > now()))
    );

  if v_sold + p_quotas > v_item.quota_total then
    raise exception 'cotas insuficientes (disponiveis: %, pedidas: %)',
      v_item.quota_total - v_sold, p_quotas;
  end if;

  -- expiração controlada no servidor: nulo/passado/>2h caem para 30min
  v_expires := case
    when p_expires_at is null then now() + interval '30 minutes'
    when p_expires_at <= now() then now() + interval '30 minutes'
    when p_expires_at > now() + interval '2 hours' then now() + interval '30 minutes'
    else p_expires_at
  end;

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
    v_expires
  )
  returning * into v_purchase;

  return v_purchase;
end;
$function$;

-- contagem por item + varredura do cron (pending vencidos)
create index if not exists idx_gift_purchases_item_status_expiry
  on public.gift_purchases (gift_item_id, status, expires_at);
