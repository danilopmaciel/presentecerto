import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/check-in
 * Registra a chegada de um convidado via QR code do convite.
 * Requer que o usuário autenticado seja o dono do evento.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const rsvpId = (body as Record<string, unknown>)?.rsvp_id;
  if (!rsvpId || typeof rsvpId !== 'string') {
    return NextResponse.json({ error: 'rsvp_id obrigatório' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: rsvp } = await admin
    .from('rsvps')
    .select('id, guest_name, adults, children, checked_in_at, event_id, events!inner(owner_id)')
    .eq('id', rsvpId)
    .single();

  if (!rsvp) {
    return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
  }

  if ((rsvp as { events: { owner_id: string } } & typeof rsvp).events.owner_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão para este evento' }, { status: 403 });
  }

  const alreadyCheckedIn = !!rsvp.checked_in_at;
  const checkedInAt = rsvp.checked_in_at ?? new Date().toISOString();

  if (!alreadyCheckedIn) {
    await admin.from('rsvps').update({ checked_in_at: checkedInAt }).eq('id', rsvpId);
  }

  return NextResponse.json({
    guest_name: rsvp.guest_name,
    adults: rsvp.adults,
    children: rsvp.children,
    already_checked_in: alreadyCheckedIn,
    checked_in_at: checkedInAt
  });
}
