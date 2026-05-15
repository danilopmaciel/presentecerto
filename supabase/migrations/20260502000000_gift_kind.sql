-- Tipo do item da lista: 'gift' (presente tradicional) ou 'buffet' (cota por pessoa)
alter table public.gift_items
  add column if not exists kind text not null default 'gift'
  check (kind in ('gift', 'buffet'));

create index if not exists gift_items_kind_idx on public.gift_items(kind);
