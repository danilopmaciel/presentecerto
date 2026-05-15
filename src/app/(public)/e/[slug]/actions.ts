'use server';

import { createClient } from '@/lib/supabase/server';
import { rsvpSchema } from '@/lib/validation/schemas';

const FIELD_LABELS: Record<string, string> = {
  event_id: 'Identificador do evento',
  guest_name: 'Nome',
  guest_email: 'E-mail',
  guest_phone: 'Telefone',
  adults: 'Adultos',
  children: 'Crianças',
  note: 'Observação'
};

function formatZodIssues(issues: Array<{ path: (string | number)[]; message: string }>): string {
  if (!issues.length) return 'Dados inválidos.';
  const parts = issues.map((i) => {
    const field = i.path[0];
    const label = typeof field === 'string' ? FIELD_LABELS[field] ?? field : 'campo';
    return `${label}: ${i.message}`;
  });
  return parts.join(' · ');
}

export async function submitRsvp(formData: FormData) {
  // 1. Proteção básica contra bots (Honeypot)
  const honeypot = formData.get('website_url');
  if (honeypot) {
    return { error: 'Bot detected' };
  }

  // 2. Normaliza valores antes de validar — campos opcionais vazios viram undefined.
  //    Zod fica menos exigente assim e a UX é a esperada.
  const str = (v: FormDataEntryValue | null): string | undefined => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s.length === 0 ? undefined : s;
  };

  const num = (v: FormDataEntryValue | null, fallback: number): number => {
    if (v == null) return fallback;
    const n = Number(String(v).trim());
    return Number.isFinite(n) ? n : fallback;
  };

  const rawData = {
    event_id: str(formData.get('event_id')),
    guest_name: str(formData.get('guest_name')),
    guest_email: str(formData.get('guest_email')),
    guest_phone: str(formData.get('guest_phone')),
    adults: num(formData.get('adults'), 1),
    children: num(formData.get('children'), 0),
    note: str(formData.get('note'))
  };

  const parsed = rsvpSchema.safeParse(rawData);
  if (!parsed.success) {
    // Loga no servidor pra investigar
    // eslint-disable-next-line no-console
    console.error('[submitRsvp] validation failed', {
      issues: parsed.error.issues,
      received: {
        ...rawData,
        // não loga o valor exato dos PII, só presença/tamanho
        guest_name: rawData.guest_name ? `<${rawData.guest_name.length} chars>` : 'missing',
        guest_email: rawData.guest_email ? '<set>' : 'missing',
        guest_phone: rawData.guest_phone ? `<${rawData.guest_phone.length} chars>` : 'missing'
      }
    });
    return {
      error: formatZodIssues(parsed.error.issues),
      issues: parsed.error.issues
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rsvps')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[submitRsvp] insert error:', error);
    return { error: `Erro ao salvar: ${error.message}` };
  }

  return { success: true, id: data.id };
}
