-- Personalização avançada do plano Temático: imagem de fundo + paleta extraída
alter table public.events
  add column if not exists custom_bg_path text,
  add column if not exists custom_palette jsonb;

-- Bucket público de uploads do evento (fundos + fotos de presentes)
insert into storage.buckets (id, name, public)
  values ('event-uploads', 'event-uploads', true)
  on conflict (id) do nothing;

-- Política: usuário autenticado pode upload/update/delete dentro da pasta dele (uid/...)
drop policy if exists "event_uploads_user_write" on storage.objects;
create policy "event_uploads_user_write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'event-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'event-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: qualquer um (incluindo anônimo) pode ler — bucket é público
drop policy if exists "event_uploads_public_read" on storage.objects;
create policy "event_uploads_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'event-uploads');
