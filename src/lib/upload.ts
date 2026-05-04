'use client';

import { createClient } from '@/lib/supabase/client';

export type UploadResult = {
  ok: boolean;
  url?: string;
  path?: string;
  error?: string;
};

/**
 * Faz upload de um File pro bucket `event-uploads` no caminho
 * `<user_id>/<scope>/<random>-<filename>`. Retorna URL pública.
 *
 * Limita extensão e tamanho.
 */
export async function uploadEventImage(
  file: File,
  scope: 'bg' | 'gift'
): Promise<UploadResult> {
  if (!file) return { ok: false, error: 'Sem arquivo.' };

  // Limites: 6MB e tipos comuns
  if (file.size > 6 * 1024 * 1024) {
    return { ok: false, error: 'Imagem muito grande (máx 6 MB).' };
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
  if (!allowed.includes(file.type) && !file.type.startsWith('image/')) {
    return { ok: false, error: 'Formato não suportado.' };
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Faça login pra fazer upload.' };

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const safeExt = ext.length > 0 && ext.length < 6 ? ext : 'jpg';
  const id = crypto.randomUUID();
  const path = `${user.id}/${scope}/${id}.${safeExt}`;

  const { error } = await supabase.storage
    .from('event-uploads')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { ok: false, error: error.message };

  const { data: pub } = supabase.storage.from('event-uploads').getPublicUrl(path);
  return { ok: true, url: pub.publicUrl, path };
}
