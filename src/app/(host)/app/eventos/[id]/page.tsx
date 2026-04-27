import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments';
import { formatBRL } from '@/lib/utils';
import { THEMES } from '@/lib/themes';
import { CopyButton } from '@/components/CopyButton';
import { ThemePicker } from '@/components/ThemePicker';
import { DeleteEventButton } from '@/components/DeleteEventButton';
import { GiftAddForm } from '@/components/GiftAddForm';
import {
  GiftSuggestionsEditor,
  type Suggestion
} from '@/components/GiftSuggestionsEditor';

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
    .select('id, buyer_name, buyer_email, quotas, amount_cents, status, paid_at, gift_item_id, created_at')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });

  const giftTitleById = new Map((gifts ?? []).map((g) => [g.id, g.title]));

  const initialSuggestions: Suggestion[] = Array.isArray(event.gift_suggestions)
    ? (event.gift_suggestions as Suggestion[])
    : [];

  const paidPurchases = purchases?.filter((p) => p.status === 'paid') ?? [];
  const pendingConfirmation = purchases?.filter((p) => p.status === 'paid_claimed') ?? [];

  const totalArrecadado = paidPurchases.reduce((s, p) => s + p.amount_cents, 0);
  const cotasPagas = paidPurchases.reduce((s, p) => s + p.quotas, 0);
  const aguardandoConfirmacao = pendingConfirmation.reduce((s, p) => s + p.amount_cents, 0);

  // --- Server Actions --------------------------------------------------------

  async function addGift(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const image_path = String(formData.get('image_path') ?? '').trim();
    const quota_value_cents = Math.round(Number(formData.get('quota_value') ?? 0) * 100);
    const quota_total = Number(formData.get('quota_total') ?? 1);

    if (!title || quota_value_cents <= 0 || quota_total <= 0) return;

    await supabase.from('gift_items').insert({
      event_id: eventId,
      title,
      description: description || null,
      image_path: image_path || null,
      quota_value_cents,
      quota_total
    });
    revalidatePath(`/app/eventos/${eventId}`);
  }

  async function setTheme(themeId: string) {
    'use server';
    const supabase = await createClient();
    if (!THEMES.find((t) => t.id === themeId)) return;
    await supabase.from('events').update({ theme: themeId }).eq('id', eventId);
    revalidatePath(`/app/eventos/${eventId}`);
  }

  async function saveSuggestions(next: Suggestion[]) {
    'use server';
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: ev } = await supabase
      .from('events')
      .select('owner_id')
      .eq('id', eventId)
      .single();
    if (!ev || ev.owner_id !== user.id) return;

    // Sanitiza: id, label obrigatório; emoji e color opcionais; máximo 30 itens.
    const clean = (next ?? [])
      .filter((s) => s && typeof s.label === 'string' && s.label.trim().length > 0)
      .slice(0, 30)
      .map((s) => ({
        id: String(s.id ?? crypto.randomUUID()),
        label: String(s.label).slice(0, 80),
        emoji: s.emoji ? String(s.emoji).slice(0, 8) : undefined,
        color: s.color ? String(s.color).slice(0, 16) : undefined
      }));

    await supabase.from('events').update({ gift_suggestions: clean }).eq('id', eventId);
    revalidatePath(`/app/eventos/${eventId}`);
  }

  async function confirmPurchase(formData: FormData) {
    'use server';
    const purchaseId = String(formData.get('purchase_id') ?? '');
    if (!purchaseId) return;
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    // Garante que essa compra pertence a um evento do usuário
    const { data: p } = await supabase
      .from('gift_purchases')
      .select('id, event_id, events!inner(owner_id)')
      .eq('id', purchaseId)
      .single();
    if (!p || (p as any).events.owner_id !== user.id) return;

    await supabase
      .from('gift_purchases')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', purchaseId);
    revalidatePath(`/app/eventos/${eventId}`);
  }

  async function rejectPurchase(formData: FormData) {
    'use server';
    const purchaseId = String(formData.get('purchase_id') ?? '');
    if (!purchaseId) return;
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: p } = await supabase
      .from('gift_purchases')
      .select('id, event_id, events!inner(owner_id)')
      .eq('id', purchaseId)
      .single();
    if (!p || (p as any).events.owner_id !== user.id) return;

    // Volta pro estado 'pending' pra convidado poder confirmar de novo
    await supabase
      .from('gift_purchases')
      .update({ status: 'pending' })
      .eq('id', purchaseId);
    revalidatePath(`/app/eventos/${eventId}`);
  }

  async function deleteEvent() {
    'use server';
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: ev } = await supabase
      .from('events')
      .select('owner_id')
      .eq('id', eventId)
      .single();
    if (!ev || ev.owner_id !== user.id) return;

    // Delete cascata — depende do ON DELETE CASCADE definido nas FKs.
    // Se o schema não tiver cascade, apaga filhos antes.
    await supabase.from('gift_purchases').delete().eq('event_id', eventId);
    await supabase.from('gift_items').delete().eq('event_id', eventId);
    await supabase.from('rsvps').delete().eq('event_id', eventId);
    await supabase.from('events').delete().eq('id', eventId);
    redirect('/app');
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

  async function waiveAndPublish() {
    'use server';
    // Modo teste: ignora pagamento e publica direto. Só funciona se NEXT_PUBLIC_TEST_MODE=true.
    if (process.env.NEXT_PUBLIC_TEST_MODE !== 'true') return;
    const supabase = await createClient();
    await supabase
      .from('events')
      .update({
        plan_payment_status: 'waived',
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', eventId);
  }

  // --- Render ----------------------------------------------------------------

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const publicUrl = `${site}/e/${event.slug}`;
  const isPublished = event.status === 'published';
  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';
  const planQrDataUrl = event.plan_pix_payload
    ? await QRCode.toDataURL(event.plan_pix_payload, { margin: 1, width: 240 })
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
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
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-md border border-brand-300 bg-white px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
        >
          {isPublished ? 'Abrir página pública ↗' : 'Pré-visualizar página ↗'}
        </a>
      </div>

      {/* Tema (apenas plano temático) */}
      {event.plan_tier === 'themed' && (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Tema da página</h2>
          <p className="mt-1 text-sm text-gray-600">
            Escolha como a página dos convidados vai parecer. O tema é aplicado na hora.
          </p>
          <ThemePicker currentTheme={event.theme ?? 'default'} onSelect={setTheme} />
        </section>
      )}

      {/* Modo teste — pular pagamento (gated por NEXT_PUBLIC_TEST_MODE=true) */}
      {testMode && !isPublished && (
        <section className="rounded-lg border border-purple-300 bg-purple-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-purple-900">🧪 Modo teste ativo</div>
              <div className="text-xs text-purple-800">
                Pula o pagamento e publica direto. Remova <code>NEXT_PUBLIC_TEST_MODE</code> da
                Vercel pra desativar.
              </div>
            </div>
            <form action={waiveAndPublish}>
              <button className="shrink-0 rounded-md bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700">
                Pular pagamento e publicar
              </button>
            </form>
          </div>
        </section>
      )}

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
              <div className="grid gap-4 sm:grid-cols-[auto,1fr]">
                {planQrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={planQrDataUrl}
                    alt="QR Code Pix do plano"
                    className="h-44 w-44 shrink-0 rounded-md border border-yellow-200 bg-white p-2"
                  />
                )}
                <div className="space-y-2">
                  <div className="rounded-md border border-yellow-200 bg-white p-3">
                    <div className="text-xs uppercase text-gray-500">Pix copia-e-cola</div>
                    <div className="mt-1 break-all font-mono text-xs">{event.plan_pix_payload}</div>
                  </div>
                  <CopyButton text={event.plan_pix_payload} />
                </div>
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
              <div key={g.id} className="flex items-center gap-4 rounded-md border border-gray-200 bg-white p-4">
                {g.image_path && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.image_path}
                    alt={g.title}
                    className="h-16 w-16 shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{g.title}</div>
                  <div className="text-sm text-gray-500">
                    {formatBRL(g.quota_value_cents)} / cota — {sold} de {g.quota_total} vendidas
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <GiftAddForm onAdd={addGift} />
        </div>
      </section>

      {/* Sugestões de presente em texto livre */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold">Sugestões de presente (sem cota)</h2>
        <p className="mt-1 text-sm text-gray-600">
          Ideias rápidas pros convidados que preferem levar um mimo no dia (roupas, calçado,
          materiais...). Aparecem como bolinhas coloridas na página pública.
        </p>
        <div className="mt-4">
          <GiftSuggestionsEditor initial={initialSuggestions} onSave={saveSuggestions} />
        </div>
      </section>

      {/* Confirmações pendentes (convidados que clicaram "já paguei") */}
      {pendingConfirmation.length > 0 && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-amber-900">
                Aguardando confirmação ({pendingConfirmation.length})
              </h2>
              <p className="mt-1 text-sm text-amber-900">
                Esses convidados disseram que já pagaram. Confirme o recebimento no seu app do banco
                e clique em <strong>Confirmar</strong> para marcar as cotas como pagas.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-amber-800">Total pendente</div>
              <div className="text-lg font-semibold text-amber-900">
                {formatBRL(aguardandoConfirmacao)}
              </div>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-amber-200 rounded-md bg-white">
            {pendingConfirmation.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{p.buyer_name}</div>
                  <div className="text-xs text-gray-500">
                    {giftTitleById.get(p.gift_item_id) ?? 'Presente'} · {p.quotas} cota(s) ·{' '}
                    {formatBRL(p.amount_cents)}
                    {p.buyer_email ? ` · ${p.buyer_email}` : ''}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={confirmPurchase}>
                    <input type="hidden" name="purchase_id" value={p.id} />
                    <button className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                      Confirmar ✓
                    </button>
                  </form>
                  <form action={rejectPurchase}>
                    <input type="hidden" name="purchase_id" value={p.id} />
                    <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                      Não recebi
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-4">
        <Stat label="Confirmados" value={String(rsvps?.length ?? 0)} />
        <Stat label="Cotas pagas" value={String(cotasPagas)} />
        <Stat label="Aguardando" value={formatBRL(aguardandoConfirmacao)} />
        <Stat label="Arrecadado" value={formatBRL(totalArrecadado)} />
      </section>

      {/* Danger zone — excluir evento */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-red-700">Excluir evento</h2>
        <p className="mt-1 text-sm text-gray-600">
          Apaga permanentemente este evento, seus presentes, RSVPs e compras. Essa ação não pode ser
          desfeita.
        </p>
        <div className="mt-3">
          <DeleteEventButton eventTitle={event.title} onDelete={deleteEvent} />
        </div>
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
