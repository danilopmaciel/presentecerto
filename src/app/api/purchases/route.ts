import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments';
import { purchaseSchema } from '@/lib/validation/schemas';
import { allowPurchase, clientIp } from '@/lib/ratelimit';

// Campo 26 do EMV Pix tem limite de 99 chars. baseLength = GUI(18) + tag01(2+2+pixKey.length) + tag02(4).
function buildPixDescription(pixKey: string, rawDescription: string): string {
  const baseLength = 18 + 2 + 2 + pixKey.length;
  const maxDescriptionLength = Math.max(0, 99 - baseLength - 4);
  return rawDescription.slice(0, maxDescriptionLength);
}

/**
 * POST /api/purchases
 * Convidado (anônimo) cria uma reserva de cotas e recebe o Pix copia-e-cola.
 * Valida disponibilidade atomicamente via RPC `purchase_quota`.
 */
export async function POST(request: Request) {
  if (!(await allowPurchase(clientIp(request.headers)))) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um minuto e tente de novo.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Honeypot check
  if ((body as any).website_url) {
    return NextResponse.json({ error: 'Bot detected' }, { status: 400 });
  }

  const input = parsed.data;

  const supabase = await createClient();

  // 1. Carrega o item + evento + chave Pix do anfitrião
  const { data: gift } = await supabase
    .from('gift_items')
    .select('id, event_id, title, quota_value_cents, quota_total')
    .eq('id', input.gift_item_id)
    .single();

  if (!gift) return NextResponse.json({ error: 'Presente não encontrado' }, { status: 404 });

  // Para pegar a chave pix do anfitrião precisamos do admin client (bypass RLS leve)
  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, title, status, owner_id')
    .eq('id', gift.event_id)
    .single();

  if (!event || event.status !== 'published') {
    return NextResponse.json({ error: 'Evento indisponível' }, { status: 400 });
  }

  const { data: owner } = await admin
    .from('profiles')
    .select('pix_key, full_name')
    .eq('id', event.owner_id)
    .single();

  if (!owner?.pix_key) {
    return NextResponse.json(
      { error: 'Anfitrião não configurou a chave Pix' },
      { status: 400 }
    );
  }

  // 2. Gera um txid candidato (25 chars) e monta o Pix estático
  const candidateTxid = crypto.randomUUID().replace(/-/g, '').slice(0, 25);
  const rawDescription = `${event.title} - ${gift.title}`;
  const description = buildPixDescription(owner.pix_key, rawDescription);
  const provider = getPaymentProvider();
  const { pixPayload, pixTxid, expiresAt } = await provider.createCharge({
    amountCents: gift.quota_value_cents * input.quotas,
    externalReference: candidateTxid,
    buyer: {
      name: input.buyer_name,
      email: input.buyer_email || null,
      phone: input.buyer_phone || null
    },
    description,
    receiver: {
      pixKey: owner.pix_key,
      merchantName: owner.full_name ?? 'ANFITRIAO',
      merchantCity: 'SAO PAULO'
    }
  });

  // 3. Reserva atomicamente via RPC (RLS-friendly, anon pode executar)
  const { data: purchase, error: rpcError } = await supabase.rpc('purchase_quota', {
    p_gift_item_id: input.gift_item_id,
    p_quotas: input.quotas,
    p_buyer_name: input.buyer_name,
    p_buyer_email: input.buyer_email || null,
    p_buyer_phone: input.buyer_phone || null,
    p_rsvp_id: input.rsvp_id ?? null,
    p_expires_at: expiresAt.toISOString(),
    p_pix_txid: pixTxid,
    p_pix_payload: pixPayload
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 400 });
  }

  return NextResponse.json({
    id: (purchase as any).id,
    amount_cents: gift.quota_value_cents * input.quotas,
    pix_payload: pixPayload,
    pix_txid: pixTxid,
    expires_at: expiresAt.toISOString()
  });
}
