'use server';

import { createClient } from '@/lib/supabase/server';
import { rsvpSchema } from '@/lib/validation/schemas';

export async function submitRsvp(formData: FormData) {
  // 1. Proteção básica contra bots (Honeypot)
  const honeypot = formData.get('website_url');
  if (honeypot) {
    // Se preencheu o campo invisível, é um bot
    return { error: 'Bot detected' };
  }

  // 2. Extração e validação básica
  const rawData = {
    event_id: formData.get('event_id'),
    guest_name: formData.get('guest_name'),
    guest_email: formData.get('guest_email'),
    guest_phone: formData.get('guest_phone'),
    adults: formData.get('adults'),
    children: formData.get('children'),
    note: formData.get('note'),
  };

  const parsed = rsvpSchema.safeParse(rawData);
  if (!parsed.success) {
    console.error('[RSVP Validation Error]', parsed.error.format());
    const firstError = parsed.error.issues[0]?.message || 'Dados inválidos';
    return { error: `Dados inválidos: ${firstError}`, issues: parsed.error.issues };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rsvps')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) {
    console.error('RSVP submission error:', error);
    return { error: 'Erro ao salvar presença. Tente novamente.' };
  }

  return { success: true, id: data.id };
}
