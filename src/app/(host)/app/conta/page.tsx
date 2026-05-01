import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@/lib/utils';
import { notifyAdmin, escapeHtml } from '@/lib/notify';
import { RefundRequestForm } from '@/components/RefundRequestForm';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, { label: string; classes: string }> = {
  available: { label: 'Disponível', classes: 'bg-green-100 text-green-800' },
  refund_requested: { label: 'Reembolso pedido', classes: 'bg-yellow-100 text-yellow-800' },
  refunded: { label: 'Reembolsado', classes: 'bg-gray-200 text-gray-700' },
  used: { label: 'Usado', classes: 'bg-blue-100 text-blue-800' }
};

const REASON_LABEL: Record<string, string> = {
  event_deleted_paid: 'Evento excluído',
  plan_change_diff: 'Diferença de plano',
  manual_credit: 'Crédito do suporte'
};

export default async function ContaPage({
  searchParams
}: {
  searchParams: Promise<{ credit?: string }>;
}) {
  const sp = await searchParams;
  const showCreditBanner = sp.credit === '1';

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: credits } = await supabase
    .from('user_credits')
    .select(
      'id, amount_cents, reason, source_event_title, status, refund_pix_key, refund_requested_at, refunded_at, created_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('pix_key, full_name')
    .eq('id', user.id)
    .single();

  const total = (credits ?? [])
    .filter((c) => c.status === 'available')
    .reduce((s, c) => s + c.amount_cents, 0);

  // ---- Server Action ------------------------------------------------------
  async function requestRefund(formData: FormData): Promise<{ error?: string } | void> {
    'use server';
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Não autenticado.' };

    const creditId = String(formData.get('credit_id') ?? '');
    const refundPixKey = String(formData.get('refund_pix_key') ?? '');
    const refundNote = String(formData.get('refund_note') ?? '').slice(0, 500);
    if (!creditId || !refundPixKey) return { error: 'Dados incompletos.' };

    const { data: credit } = await supabase
      .from('user_credits')
      .select('id, user_id, amount_cents, source_event_title, status')
      .eq('id', creditId)
      .single();
    if (!credit || credit.user_id !== user.id) return { error: 'Sem permissão.' };
    if (credit.status !== 'available') {
      return { error: 'Esse crédito não está disponível pra reembolso.' };
    }

    await supabase
      .from('user_credits')
      .update({
        status: 'refund_requested',
        refund_pix_key: refundPixKey,
        refund_note: refundNote || null,
        refund_requested_at: new Date().toISOString()
      })
      .eq('id', creditId);

    await notifyAdmin(
      [
        `💸 Pedido de <b>reembolso</b>`,
        `Anfitrião: ${escapeHtml(user.email ?? '')}`,
        `Evento: ${escapeHtml(credit.source_event_title ?? '—')}`,
        `Valor: R$ ${(credit.amount_cents / 100).toFixed(2).replace('.', ',')}`,
        `Chave Pix: <code>${escapeHtml(refundPixKey)}</code>`,
        refundNote ? `Obs: ${escapeHtml(refundNote)}` : '',
        `Acompanhe em /app/admin`
      ]
        .filter(Boolean)
        .join('\n')
    );

    revalidatePath('/app/conta');
    revalidatePath('/app/admin');
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/app" className="text-sm text-gray-500 hover:underline">
          ← Meus eventos
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Minha conta</h1>
        <p className="text-sm text-gray-500">
          Logada com <span className="font-mono">{user.email}</span>.
        </p>
      </div>

      {showCreditBanner && (
        <div className="rounded-md border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
          🪙 Como o evento já estava pago, o valor virou crédito aqui na sua conta. Você pode pedir
          reembolso da chave Pix abaixo.
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Créditos disponíveis</h2>
            <p className="mt-1 text-sm text-gray-600">
              Saldo gerado por exclusão de eventos pagos ou ajustes do suporte.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-gray-500">Saldo</div>
            <div className="text-2xl font-bold text-brand-700">{formatBRL(total)}</div>
          </div>
        </div>

        {!credits || credits.length === 0 ? (
          <p className="mt-6 rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Você ainda não tem nenhum crédito.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {credits.map((c) => {
              const meta = STATUS_LABEL[c.status] ?? STATUS_LABEL.available;
              return (
                <li key={c.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold">
                          {formatBRL(c.amount_cents)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${meta.classes}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-gray-600">
                        {REASON_LABEL[c.reason] ?? c.reason}
                        {c.source_event_title ? ` · ${c.source_event_title}` : ''}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-500">
                        Gerado em {new Date(c.created_at).toLocaleString('pt-BR')}
                        {c.refund_requested_at && (
                          <>
                            {' '}· pedido em{' '}
                            {new Date(c.refund_requested_at).toLocaleDateString('pt-BR')}
                          </>
                        )}
                        {c.refunded_at && (
                          <>
                            {' '}· reembolsado em{' '}
                            {new Date(c.refunded_at).toLocaleDateString('pt-BR')}
                          </>
                        )}
                      </div>
                      {c.refund_pix_key && (
                        <div className="mt-0.5 text-[11px] text-gray-500">
                          Pix do reembolso:{' '}
                          <span className="font-mono">{c.refund_pix_key}</span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {c.status === 'available' && (
                        <RefundRequestForm
                          creditId={c.id}
                          defaultPixKey={profile?.pix_key ?? null}
                          onSubmit={requestRefund}
                        />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
