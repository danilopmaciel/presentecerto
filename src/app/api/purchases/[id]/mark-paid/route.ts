import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

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
  const { error } = await admin
    .from('gift_purchases')
    .update({ status: 'paid_claimed' })
    .eq('id', id)
    .eq('status', 'pending');

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
