-- Sugestões de presente em texto livre (pills coloridos)
-- Estrutura: array de objetos { id: string, label: string, emoji?: string, color?: string }
alter table public.events
  add column if not exists gift_suggestions jsonb not null default '[]'::jsonb;
