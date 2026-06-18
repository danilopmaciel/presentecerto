import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notifyAdmin, escapeHtml } from '@/lib/notify';

/**
 * POST /api/ai-credits/request  { event_id }
 * O anfitrião pede mais créditos de geração por IA pro evento dele.
 * Marca ai_extra_requested_at; o admin libera (+5) no painel.
 */
export async function POST(request: Request) {
  let body: { event_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const eventId = String(body.event_id ?? '').trim();
  if (!eventId) return NextResponse.json({ error: 'event_id ausente.' }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Faça login.' }, { status: 401 });

  const { data: ev } = await supabase
    .from('events')
    .select('id, title, owner_id, ai_extra_requested_at')
    .eq('id', eventId)
    .single();
  if (!ev || ev.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  }
  if (ev.ai_extra_requested_at) {
    return NextResponse.json({ ok: true, already: true });
  }

  const admin = createAdminClient();
  await admin
    .from('events')
    .update({ ai_extra_requested_at: new Date().toISOString() })
    .eq('id', eventId);

  await notifyAdmin(
    `✨ <b>Pedido de mais créditos de IA</b>\nEvento: ${escapeHtml(ev.title)}`
  );

  return NextResponse.json({ ok: true });
}
