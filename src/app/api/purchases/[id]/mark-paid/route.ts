import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyTelegram } from '@/lib/telegram';

/**
 * POST /api/purchases/:id/mark-paid
 * Convidado clica "já paguei". Marca status='paid_claimed' (aguardando
 * confirmação manual do anfitrião). Não confia que realmente pagou.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('gift_purchases')
    .update({ status: 'paid_claimed' })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id, buyer_name, quotas, amount_cents, gift_items(title), events(title)');

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: 'Compra não encontrada ou já foi processada' },
      { status: 400 }
    );
  }

  // Avisa o anfitrião no Telegram pra ele conferir o Pix (fail-open).
  const p = data[0] as unknown as {
    buyer_name: string | null;
    quotas: number;
    amount_cents: number;
    gift_items: { title: string } | { title: string }[] | null;
    events: { title: string } | { title: string }[] | null;
  };
  const giftTitle = Array.isArray(p.gift_items) ? p.gift_items[0]?.title : p.gift_items?.title;
  const eventTitle = Array.isArray(p.events) ? p.events[0]?.title : p.events?.title;
  const valor = (p.amount_cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  await notifyTelegram(
    `💸 <b>Pagamento declarado!</b>\n\n` +
      `🎁 ${giftTitle ?? 'Presente'} (${p.quotas} cota${p.quotas !== 1 ? 's' : ''})\n` +
      `👤 ${p.buyer_name ?? 'Alguém'}\n` +
      `💰 ${valor}\n` +
      `📋 Evento: ${eventTitle ?? '-'}\n\n` +
      `Confira o Pix no seu banco e confirme no painel.`
  );

  return NextResponse.json({ ok: true });
}
