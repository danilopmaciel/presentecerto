import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import { formatBRL } from '@/lib/utils';
import { notifyAdmin, escapeHtml } from '@/lib/notify';

export const dynamic = 'force-dynamic';

type EventLite = {
  id: string;
  slug: string | null;
  title: string;
  starts_at: string;
  status: string;
  plan_tier: string;
  plan_fee_cents: number;
  plan_payment_status: string;
  plan_pix_txid: string | null;
  plan_paid_at: string | null;
  owner_id: string;
  updated_at: string;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!isAdminEmail(user.email)) redirect('/app');

  // Admin lê com service_role → bypass RLS (admin precisa ver eventos de todos os anfitriões)
  const admin = createAdminClient();

  const { data: pending } = await admin
    .from('events')
    .select(
      'id, slug, title, starts_at, status, plan_tier, plan_fee_cents, plan_payment_status, plan_pix_txid, plan_paid_at, owner_id, updated_at'
    )
    .eq('plan_payment_status', 'paid_claimed')
    .order('updated_at', { ascending: false });

  const { data: recentPaid } = await admin
    .from('events')
    .select(
      'id, slug, title, starts_at, status, plan_tier, plan_fee_cents, plan_payment_status, plan_pix_txid, plan_paid_at, owner_id, updated_at'
    )
    .in('plan_payment_status', ['paid', 'waived'])
    .order('plan_paid_at', { ascending: false, nullsFirst: false })
    .limit(20);

  // Resolve nome/email dos donos
  const ownerIds = Array.from(
    new Set([...(pending ?? []), ...(recentPaid ?? [])].map((e) => e.owner_id))
  );
  const { data: profiles } = ownerIds.length
    ? await admin
        .from('profiles')
        .select('id, full_name, pix_key')
        .in('id', ownerIds)
    : { data: [] };
  const profById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const totalPending = (pending ?? []).reduce((s, e) => s + e.plan_fee_cents, 0);

  // ---- Server Actions -----------------------------------------------------

  async function confirmPlanPaid(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user || !isAdminEmail(user.email)) return;

    const eventId = String(formData.get('event_id') ?? '');
    if (!eventId) return;

    const autoPublish = formData.get('auto_publish') === '1';

    const update: Record<string, unknown> = {
      plan_payment_status: 'paid',
      plan_paid_at: new Date().toISOString()
    };
    if (autoPublish) {
      update.status = 'published';
      update.published_at = new Date().toISOString();
    }

    const adminCli = createAdminClient();
    await adminCli.from('events').update(update).eq('id', eventId);
    revalidatePath('/app/admin');
    revalidatePath(`/app/eventos/${eventId}`);
  }

  async function rejectPlanPaid(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user || !isAdminEmail(user.email)) return;

    const eventId = String(formData.get('event_id') ?? '');
    if (!eventId) return;

    const adminCli = createAdminClient();
    // Volta pra pending — anfitrião pode tentar de novo
    await adminCli
      .from('events')
      .update({ plan_payment_status: 'pending' })
      .eq('id', eventId);

    // Avisa pelo Telegram pra você lembrar de mensagem o anfitrião
    const ev = (pending ?? []).find((e) => e.id === eventId);
    if (ev) {
      await notifyAdmin(
        `❌ Pagamento <b>rejeitado</b>\nEvento: ${escapeHtml(ev.title)}\nValor: ${formatBRL(
          ev.plan_fee_cents
        )}`
      );
    }
    revalidatePath('/app/admin');
  }

  // ---- Render -------------------------------------------------------------

  const renderRow = (e: EventLite, mode: 'pending' | 'paid') => {
    const prof = profById.get(e.owner_id);
    return (
      <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/app/eventos/${e.id}`}
              className="font-medium text-brand-700 hover:underline"
            >
              {e.title}
            </Link>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-700">
              {e.plan_tier === 'themed' ? 'Temático' : 'Básico'}
            </span>
            {e.status === 'published' && (
              <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] uppercase text-green-800">
                Publicado
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            {prof?.full_name ?? 'sem nome'} ·{' '}
            <span className="font-mono">{prof?.pix_key ?? '—'}</span>
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            Festa em {new Date(e.starts_at).toLocaleDateString('pt-BR')} · txid:{' '}
            <span className="font-mono">{e.plan_pix_txid ?? '—'}</span>
          </div>
          {mode === 'paid' && e.plan_paid_at && (
            <div className="mt-0.5 text-xs text-green-700">
              Pago em {new Date(e.plan_paid_at).toLocaleString('pt-BR')}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-right text-sm font-semibold">
            {formatBRL(e.plan_fee_cents)}
          </div>
          {mode === 'pending' && (
            <div className="flex gap-2">
              <form action={confirmPlanPaid}>
                <input type="hidden" name="event_id" value={e.id} />
                <input type="hidden" name="auto_publish" value="1" />
                <button className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                  ✓ Confirmar e publicar
                </button>
              </form>
              <form action={confirmPlanPaid}>
                <input type="hidden" name="event_id" value={e.id} />
                <button className="rounded-md border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50">
                  Só confirmar
                </button>
              </form>
              <form action={rejectPlanPaid}>
                <input type="hidden" name="event_id" value={e.id} />
                <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                  Rejeitar
                </button>
              </form>
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/app" className="text-sm text-gray-500 hover:underline">
            ← Voltar
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Admin · Pagamentos</h1>
          <p className="text-sm text-gray-500">
            Confirme manualmente os pagamentos do plano antes de liberar a publicação.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Aguardando confirmação" value={String(pending?.length ?? 0)} />
        <Stat label="Total a confirmar" value={formatBRL(totalPending)} />
        <Stat label="Eventos pagos (lista)" value={String(recentPaid?.length ?? 0)} />
      </div>

      {/* Pendentes */}
      <section>
        <h2 className="text-lg font-semibold">Aguardando confirmação</h2>
        {!pending || pending.length === 0 ? (
          <p className="mt-2 rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Nada por aqui. Quando alguém clicar em "Já paguei" no painel do evento, vai aparecer
            aqui.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-yellow-300 bg-yellow-50">
            {pending.map((e) => renderRow(e, 'pending'))}
          </ul>
        )}
      </section>

      {/* Pagos recentes */}
      <section>
        <h2 className="text-lg font-semibold">Pagos recentes</h2>
        {!recentPaid || recentPaid.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Nenhum evento confirmado ainda.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200 bg-white">
            {recentPaid.map((e) => renderRow(e, 'paid'))}
          </ul>
        )}
      </section>

      <section className="rounded-md border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
        <strong>Notificações:</strong> seta as ENVs <code>TELEGRAM_BOT_TOKEN</code> e{' '}
        <code>TELEGRAM_CHAT_ID</code> na Vercel pra receber um aviso no Telegram toda vez que
        alguém clicar em "Já paguei". Sem essas envs, o app continua funcionando — só fica em
        silêncio.
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
