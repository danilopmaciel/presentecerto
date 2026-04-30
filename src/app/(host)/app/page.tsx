import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@/lib/utils';

export default async function MyEventsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: events } = await supabase
    .from('events')
    .select('id, slug, title, starts_at, status, plan_tier, plan_fee_cents, plan_payment_status')
    .eq('owner_id', user.id)
    .order('starts_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus eventos</h1>
        <Link
          href="/app/eventos/novo"
          className="rounded-md bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600"
        >
          + Novo evento
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {events?.length === 0 && (
          <div className="rounded-md border border-dashed border-gray-300 p-10 text-center text-gray-500">
            Você ainda não criou nenhum evento.{' '}
            <Link href="/app/eventos/novo" className="text-brand-600 underline">
              Criar o primeiro
            </Link>
            .
          </div>
        )}
        {events?.map((e) => (
          <Link
            key={e.id}
            href={`/app/eventos/${e.id}`}
            className="block rounded-md border border-gray-200 bg-white p-4 hover:border-brand-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-sm text-gray-500">
                  {new Date(e.starts_at).toLocaleString('pt-BR')}
                </div>
              </div>
              <div className="text-right text-sm">
                <StatusBadge status={e.status} paymentStatus={e.plan_payment_status} />
                <div className="mt-1 text-gray-500">
                  Plano {e.plan_tier === 'basic' ? 'Básico' : 'Temático'} —{' '}
                  {formatBRL(e.plan_fee_cents)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  paymentStatus
}: {
  status: string;
  paymentStatus: string;
}) {
  if (status === 'published')
    return <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Publicado</span>;
  if (status === 'awaiting_payment' || paymentStatus === 'paid_claimed')
    return (
      <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
        Aguardando pagamento
      </span>
    );
  return <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">Rascunho</span>;
}
