-- 1. Tipo do item da lista: 'gift' (presente tradicional) ou 'buffet' (cota por pessoa)
alter table public.gift_items
  add column if not exists kind text not null default 'gift'
  check (kind in ('gift', 'buffet'));

create index if not exists gift_items_kind_idx on public.gift_items(kind);

-- 2. Configurações de buffet no evento
alter table public.events
  add column if not exists enable_buffet boolean not null default false,
  add column if not exists buffet_title text not null default 'Buffet',
  add column if not exists buffet_description text not null default 'O anfitrião sugere uma contribuição por pessoa pra ajudar com o buffet. Você escolhe quantas vagas vai cobrir.';
