import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments';
import { formatBRL } from '@/lib/utils';

export default async function EventDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!event || event.owner_id !== user.id) notFound();

  const { data: gifts } = await supabase
    .from('gift_items')
    .select('*')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true });

  const { data: rsvps } = await supabase
    .from('rsvps')
    .select('id, guest_name, adults, children, created_at')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: purchases } = await supabase
    .from('gift_purchases')
    .select('id, buyer_name, quotas, amount_cents, status, paid_at, gift_item_id')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });

  const totalArrecadado =
    purchases?.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount_cents, 0) ?? 0;

  // --- Server Actions --------------------------------------------------------

  async function addGift(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const quota_value_cents = Math.round(Number(formData.get('quota_value') ?? 0) * 100);
    const quota_total = Number(formData.get('quota_total') ?? 1);

    if (!title || quota_value_cents <= 0 || quota_total <= 0) return;

    await supabase.from('gift_items').insert({
      event_id: eventId,
      title,
      description: description || null,
      quota_value_cents,
      quota_total
    });
  }

  async function generatePlanPix() {
    'use server';
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: ev } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    if (!ev || ev.owner_id !== user.id) return;
    if (ev.plan_payment_status === 'paid') return;

    const provider = getPaymentProvider();
    const { pixPayload, pixTxid } = await provider.createCharge({
      amountCents: ev.plan_fee_cents,
      externalReference: ev.id,
      buyer: { name: user.email ?? 'anfitriao', email: user.email },
      description: `Plano ${ev.plan_tier === 'themed' ? 'Tematico' : 'Basico'} PresenteCerto`
      // sem receiver → usa as ENVs SAAS_PIX_* (a chave é NOSSA)
    });

    await supabase
      .from('events')
      .update({
        plan_pix_payload: pixPayload,
        plan_pix_txid: pixTxid,
        plan_payment_status: 'pending',
        status: 'awaiting_payment'
      })
      .eq('id', ev.id);
  }

  async function markPlanPaidByHost() {
    'use server';
    // Anfitrião declara "já paguei" — vai pra estado 'paid_claimed'.
    // Você (operador) confirma manualmente em uma tela admin ou direto no SQL
    // quando o Pix cair na sua conta. Só depois disso o evento pode publicar.
    const supabase = await createClient();
    await supabase
      .from('events')
      .update({ plan_payment_status: 'paid_claimed' })
      .eq('id', eventId);
  }

  async function publish() {
    'use server';
    const supabase = await createClient();
    const { data: ev } = await supabase
      .from('events')
      .select('plan_payment_status')
      .eq('id', eventId)
      .single();
    if (!ev || (ev.plan_payment_status !== 'paid' && ev.plan_payment_status !== 'waived')) return;

    await supabase
      .from('events')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', eventId);
  }

  // --- Render ----------------------------------------------------------------

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const publicUrl = `${site}/e/${event.slug}`;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/app" className="text-sm text-gray-500 hover:underline">
            ← Meus eventos
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{event.title}</h1>
          <p className="text-sm text-gray-500">
            {new Date(event.starts_at).toLocaleString('pt-BR')}
            {event.location_text ? ` · ${event.location_text}` : ''}
          </p>
        </div>
        {event.status === 'published' && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-brand-300 bg-white px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
          >
            Abrir página pública ↗
          </a>
        )}
      </div>

      {/* Pagamento do plano */}
      {event.plan_payment_status !== 'paid' && event.plan_payment_status !== 'waived' && (
        <section className="rounded-lg border border-yellow-300 bg-yellow-50 p-6">
          <h2 className="font-semibold text-yellow-900">
            Pagamento do plano {event.plan_tier === 'themed' ? 'Temático' : 'Básico'} —{' '}
            {formatBRL(event.plan_fee_cents)}
          </h2>
          <p className="mt-1 text-sm text-yellow-900">
            Para publicar seu evento, pague a taxa única via Pix abaixo. Este valor cobre a criação
            da página e {event.plan_tier === 'themed' ? 'os convites automáticos' : 'o painel do anfitrião'}.
          </p>

          {!event.plan_pix_payload ? (
            <form action={generatePlanPix} className="mt-4">
              <button className="rounded-md bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700">
                Gerar Pix do plano
              </button>
            </form>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="rounded-md border border-yellow-200 bg-white p-4">
                <div className="text-xs uppercase text-gray-500">Pix copia-e-cola</div>
                <div className="mt-1 break-all font-mono text-xs">{event.plan_pix_payload}</div>
              </div>
              {event.plan_payment_status === 'pending' && (
                <form action={markPlanPaidByHost}>
                  <button className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                    Já paguei — avisar PresenteCerto
                  </button>
                </form>
              )}
              {event.plan_payment_status === 'paid_claimed' && (
                <div className="text-sm text-yellow-900">
                  ⏳ Recebemos seu aviso. Em breve confirmaremos o pagamento e liberaremos a
                  publicação (até 24h nos dias úteis).
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Publicar */}
      {(event.plan_payment_status === 'paid' || event.plan_payment_status === 'waived') &&
        event.status !== 'published' && (
          <section className="rounded-lg border border-green-300 bg-green-50 p-6">
            <h2 className="font-semibold text-green-900">Pronto para publicar</h2>
            <p className="mt-1 text-sm text-green-900">
              Revise os presentes e publique. Depois de publicado, seus convidados podem acessar{' '}
              <code>{publicUrl}</code>.
            </p>
            <form action={publish} className="mt-3">
              <button className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                Publicar evento
              </button>
            </form>
          </section>
        )}

      {/* Presentes */}
      <section>
        <h2 className="text-lg font-semibold">Lista de presentes (cotas)</h2>
        <div className="mt-3 space-y-2">
          {gifts?.map((g) => {
            const sold = purchases
              ?.filter(
                (p) => p.gift_item_id === g.id && (p.status === 'paid' || p.status === 'paid_claimed' || p.status === 'pending')
              )
              .reduce((s, p) => s + p.quotas, 0) ?? 0;
            return (
              <div key={g.id} className="rounded-md border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{g.title}</div>
                    <div className="text-sm text-gray-500">
                      {formatBRL(g.quota_value_cents)} / cota — {sold} de {g.quota_total} vendidas
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form action={addGift} className="mt-4 space-y-3 rounded-md border border-dashed border-gray-300 p-4">
          <div className="text-sm font-medium">Adicionar presente</div>
          <input name="title" required placeholder="Ex.: Triciclo — cotas de R$ 50" className="w-full rounded-md border border-gray-300 px-3 py-2" />
          <input name="description" placeholder="Descrição opcional" className="w-full rounded-md border border-gray-300 px-3 py-2" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Valor da cota (R$)
              <input name="quota_value" type="number" step="0.01" min="1" required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
            </label>
            <label className="block text-sm">
              Nº de cotas
              <input name="quota_total" type="number" min="1" defaultValue={10} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
            </label>
          </div>
          <button className="rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-600">Adicionar</button>
        </form>
      </section>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <Stat label="Confirmados" value={String(rsvps?.length ?? 0)} />
        <Stat label="Cotas pagas" value={String(purchases?.filter((p) => p.status === 'paid').length ?? 0)} />
        <Stat label="Arrecadado" value={formatBRL(totalArrecadado)} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
