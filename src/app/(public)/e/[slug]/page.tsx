import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { RsvpAndGiftForm } from './RsvpAndGiftForm';

export const dynamic = 'force-dynamic';

export default async function PublicEventPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from('events')
    .select('id, slug, title, description, starts_at, location_text, location_maps_url, theme, status')
    .eq('slug', slug)
    .single();

  if (!event || event.status !== 'published') notFound();

  const { data: gifts } = await supabase
    .from('gift_items')
    .select('id, title, description, quota_value_cents, quota_total')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true });

  // cotas já reservadas (pending + paid_claimed + paid)
  const { data: reservedRows } = await supabase
    .from('gift_purchases')
    .select('gift_item_id, quotas, status')
    .eq('event_id', event.id);

  const reservedMap = new Map<string, number>();
  for (const p of reservedRows ?? []) {
    if (['pending', 'paid_claimed', 'paid'].includes(p.status)) {
      reservedMap.set(p.gift_item_id, (reservedMap.get(p.gift_item_id) ?? 0) + p.quotas);
    }
  }

  const giftsWithAvail = (gifts ?? []).map((g) => ({
    ...g,
    reserved: reservedMap.get(g.id) ?? 0,
    available: g.quota_total - (reservedMap.get(g.id) ?? 0)
  }));

  return (
    <main className="min-h-screen bg-brand-50">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-brand-900">{event.title}</h1>
          <p className="mt-2 text-gray-700">
            {new Date(event.starts_at).toLocaleString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          {event.location_text && (
            <p className="mt-1 text-gray-600">
              {event.location_maps_url ? (
                <Link href={event.location_maps_url} target="_blank" className="underline">
                  {event.location_text}
                </Link>
              ) : (
                event.location_text
              )}
            </p>
          )}
          {event.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{event.description}</p>
          )}
        </header>

        <RsvpAndGiftForm eventId={event.id} gifts={giftsWithAvail} />

        <footer className="mt-12 text-center text-xs text-gray-500">
          Página criada com{' '}
          <Link href="/" className="underline">
            PresenteCerto
          </Link>
        </footer>
      </div>
    </main>
  );
}
