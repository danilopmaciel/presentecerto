'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { uniqueSlug } from '@/lib/utils';
import { eventCreateSchema } from '@/lib/validation/schemas';
import { normalizePixKey } from '@/lib/pix-key';

type DraftGiftInput = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  kind?: unknown;
  quota_value?: unknown;
  quota_total?: unknown;
};

type DraftInput = {
  title?: unknown;
  description?: unknown;
  starts_at?: unknown;
  location_text?: unknown;
  location_maps_url?: unknown;
  plan_tier?: unknown;
  pix_key?: unknown;
  full_name?: unknown;
  phone?: unknown;
  gifts?: DraftGiftInput[];
};

/**
 * Migra um rascunho do localStorage pra um evento real no Supabase.
 * Exige usuário autenticado. Atualiza nome/telefone no profile se vier preenchido.
 * Retorna `{ event_id }` ou `{ error }`. Quando bem-sucedido, o cliente redireciona
 * pro `/app/eventos/{event_id}` (onde o anfitrião segue pra pagar/publicar).
 */
export async function finalizeDraft(input: DraftInput) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Você precisa estar logada/o pra criar o evento.' };
  }

  const rawPixKey = String(input.pix_key ?? '');
  const parsed = eventCreateSchema.safeParse({
    title: String(input.title ?? '').trim(),
    description: String(input.description ?? '').trim(),
    starts_at: input.starts_at
      ? new Date(String(input.starts_at)).toISOString()
      : '',
    location_text: String(input.location_text ?? '').trim(),
    location_maps_url: String(input.location_maps_url ?? '').trim(),
    plan_tier: input.plan_tier === 'themed' ? 'themed' : 'basic',
    pix_key: normalizePixKey(rawPixKey)
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      error: `Dados inválidos no rascunho: ${firstIssue?.path?.[0] ?? ''} ${firstIssue?.message ?? ''}`.trim()
    };
  }

  // Atualiza profile: pix_key sempre; nome/telefone só se vieram
  const fullName = String(input.full_name ?? '').trim();
  const phone = String(input.phone ?? '').trim();
  const profileUpdate: Record<string, string> = {
    pix_key: parsed.data.pix_key
  };
  if (fullName) profileUpdate.full_name = fullName.slice(0, 120);
  if (phone) profileUpdate.phone = phone.slice(0, 20);

  await supabase.from('profiles').update(profileUpdate).eq('id', user.id);

  const slug = uniqueSlug(parsed.data.title);
  const planFeeCents = parsed.data.plan_tier === 'themed' ? 5000 : 2000;

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      owner_id: user.id,
      slug,
      title: parsed.data.title,
      description: parsed.data.description || null,
      starts_at: parsed.data.starts_at,
      location_text: parsed.data.location_text || null,
      location_maps_url: parsed.data.location_maps_url || null,
      plan_tier: parsed.data.plan_tier,
      plan_fee_cents: planFeeCents,
      status: 'draft'
    })
    .select('id')
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[finalizeDraft] insert event failed:', error);
    return { error: `Erro ao criar evento: ${error.message}` };
  }

  // Insere presentes do rascunho, se houver
  const gifts = Array.isArray(input.gifts) ? input.gifts : [];
  const planTier = parsed.data.plan_tier;
  if (gifts.length > 0) {
    const rows = gifts
      .filter((g) => String(g.title ?? '').trim().length > 0)
      .map((g, i) => {
        const rawKind = String(g.kind ?? 'gift');
        const kind: 'gift' | 'buffet' =
          rawKind === 'buffet' && planTier === 'themed' ? 'buffet' : 'gift';
        const quotaValue = Math.round(Number(g.quota_value ?? 0) * 100);
        const quotaTotal = kind === 'buffet' ? 999999 : Math.max(1, Number(g.quota_total ?? 1));
        return {
          event_id: event.id,
          title: String(g.title ?? '').trim().slice(0, 200),
          description: String(g.description ?? '').trim() || null,
          kind,
          quota_value_cents: quotaValue,
          quota_total: quotaTotal,
          sort_order: i
        };
      })
      .filter((r) => r.quota_value_cents > 0);

    if (rows.length > 0) {
      await supabase.from('gift_items').insert(rows);
    }
  }

  return { event_id: event.id };
}

/**
 * Wrapper que faz a action acima E redireciona. Server action de formulário
 * não pode "retornar" pro client a UUID e fazer redirect ao mesmo tempo, então
 * a página /criar/finalizar usa finalizeDraft direto e cuida do redirect no client.
 *
 * Mantemos esse wrapper só pra caso queiramos uma versão "submit nativo" no futuro.
 */
export async function finalizeDraftAndRedirect(input: DraftInput): Promise<never> {
  const res = await finalizeDraft(input);
  if ('error' in res) throw new Error(res.error);
  redirect(`/app/eventos/${res.event_id}`);
}
