import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getTheme } from '@/lib/themes';
import { RsvpAndGiftForm } from './RsvpAndGiftForm';
import { GiftSuggestionsDisplay } from '@/components/GiftSuggestionsDisplay';
import type { Suggestion } from '@/components/GiftSuggestionsEditor';

export const dynamic = 'force-dynamic';

export default async function PublicEventPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: event } = await supabase
    .from('events')
    .select('id, slug, owner_id, title, description, starts_at, location_text, location_maps_url, theme, status, plan_tier, gift_suggestions')
    .eq('slug', slug)
    .single();

  if (!event) notFound();

  // Permite preview pro dono mesmo se ainda não publicou
  const isOwnerPreview = !!user && event.owner_id === user.id;
  if (event.status !== 'published' && !isOwnerPreview) notFound();

  const { data: gifts } = await supabase
    .from('gift_items')
    .select('id, title, description, image_path, quota_value_cents, quota_total')
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

  // Tema só aplica em plano Temático; Básico fica sempre no padrão
  const themeId = event.plan_tier === 'themed' ? event.theme ?? 'default' : 'default';
  const theme = getTheme(themeId);
  const Decoration = theme.Decoration;
  const HeroArt = theme.HeroArt;
  const isPreview = event.status !== 'published';
  const suggestions: Suggestion[] = Array.isArray(event.gift_suggestions)
    ? (event.gift_suggestions as Suggestion[])
    : [];

  return (
    <main className={`relative min-h-screen overflow-hidden ${theme.pageBg}`}>
      {theme.pattern && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ backgroundImage: theme.pattern }}
        />
      )}
      {isPreview && (
        <div className="relative bg-yellow-400 px-4 py-2 text-center text-sm font-medium text-yellow-900">
          🚧 Pré-visualização — esta página ainda não foi publicada para os convidados.
        </div>
      )}
      <div className="relative mx-auto max-w-2xl px-6 py-10">
        {Decoration && <Decoration />}

        {HeroArt && (
          <div className="mb-4">
            <HeroArt />
          </div>
        )}

        <header className="relative text-center">
          <h1 className={`text-4xl font-extrabold tracking-tight drop-shadow-sm ${theme.titleColor}`}>
            {event.title}
          </h1>
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

        <GiftSuggestionsDisplay suggestions={suggestions} accent={theme.accent} />

        <RsvpAndGiftForm
          eventId={event.id}
          gifts={giftsWithAvail}
          cardClass={theme.cardClass}
          accent={theme.accent}
        />

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
