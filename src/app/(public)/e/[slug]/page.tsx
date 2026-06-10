import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import { getTheme } from '@/lib/themes';
import { RsvpAndGiftForm } from './RsvpAndGiftForm';
import { GiftSuggestionsDisplay } from '@/components/GiftSuggestionsDisplay';
import type { Suggestion } from '@/components/GiftSuggestionsEditor';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

// Páginas de evento são por-link (privadas). Não devem aparecer em buscas.
export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

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

  // Server-side com admin client + select EXPLÍCITO de campos seguros.
  // Bypassa RLS pra ler colunas necessárias sem expor plan_pix_payload, plan_pix_txid,
  // plan_paid_at, ai_generations_used, etc, que ficariam acessíveis se um curioso
  // fosse direto na anon API (RLS é por linha, não por coluna).
  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events')
    .select('id, slug, owner_id, title, description, starts_at, location_text, location_maps_url, theme, status, plan_tier, gift_suggestions, custom_bg_path, custom_palette, enable_buffet, buffet_title, buffet_description')
    .eq('slug', slug)
    .single();

  if (!event) notFound();

  // Permite preview pro dono e para admin mesmo se ainda não publicou
  const isOwnerPreview = !!user && event.owner_id === user.id;
  const isAdminView = !!user && isAdminEmail(user.email);
  if (event.status !== 'published' && !isOwnerPreview && !isAdminView) notFound();

  // As 3 queries dependem só de event.id — em paralelo, o tempo de banco da
  // página cai de ~3 RTTs em cascata pra 1 (banco fica em us-west-2, longe do BR).
  const [{ data: gifts }, { data: reservedRows }, { data: paidPurchases }] = await Promise.all([
    admin
      .from('gift_items')
      .select('id, title, description, image_path, quota_value_cents, quota_total, kind')
      .eq('event_id', event.id)
      .order('sort_order', { ascending: true }),
    // Cotas reservadas — admin client ignora RLS, então convidados anônimos veem
    // a barra de progresso real (não zero, como acontecia com a anon key).
    admin
      .from('gift_purchases')
      .select('gift_item_id, quotas, status, expires_at')
      .eq('event_id', event.id),
    // Colaboradores — só buyer_name (NÃO email/phone); filtro de privacidade.
    admin
      .from('gift_purchases')
      .select('buyer_name, gift_item_id, paid_at')
      .eq('event_id', event.id)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
  ]);

  const now = Date.now();
  const reservedMap = new Map<string, number>();
  for (const p of reservedRows ?? []) {
    // pending só prende cota enquanto o Pix não venceu — reserva abandonada
    // volta pra lista mesmo antes de o cron marcá-la como expired.
    const holds =
      p.status === 'paid' ||
      p.status === 'paid_claimed' ||
      (p.status === 'pending' && (!p.expires_at || new Date(p.expires_at).getTime() > now));
    if (holds) {
      reservedMap.set(p.gift_item_id, (reservedMap.get(p.gift_item_id) ?? 0) + p.quotas);
    }
  }

  const giftsWithAvail = (gifts ?? [])
    .filter((g) => event.enable_buffet || g.kind !== 'buffet')
    .map((g) => ({
      ...g,
      reserved: reservedMap.get(g.id) ?? 0,
      available: g.quota_total - (reservedMap.get(g.id) ?? 0)
    }));

  const giftTitleById = new Map((gifts ?? []).map((g) => [g.id, g.title]));
  const collaborators = (paidPurchases ?? []).map((p) => ({
    name: p.buyer_name,
    giftTitle: giftTitleById.get(p.gift_item_id) ?? 'Presente'
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

  // Tema personalizado (plano temático com bg image enviado)
  const customBgUrl: string | null =
    event.plan_tier === 'themed' && event.custom_bg_path ? event.custom_bg_path : null;
  const rawPalette = event.custom_palette;
  const customPalette =
    customBgUrl &&
    rawPalette !== null &&
    typeof rawPalette === 'object' &&
    'accent' in rawPalette &&
    'bg' in rawPalette &&
    'text' in rawPalette &&
    typeof (rawPalette as Record<string, unknown>).accent === 'string' &&
    typeof (rawPalette as Record<string, unknown>).bg === 'string' &&
    typeof (rawPalette as Record<string, unknown>).text === 'string'
      ? (rawPalette as { accent: string; bg: string; text: string })
      : null;
  const themeAccent = customPalette?.accent ?? theme.accent;
  const themeTextColor = customPalette?.text ?? null;
  const themeCardClass = customPalette ? 'bg-white/95 ring-1 ring-black/10 backdrop-blur' : theme.cardClass;

  return (
    <main
      className={`relative min-h-dvh overflow-hidden ${customBgUrl ? '' : theme.pageBg}`}
      style={
        customBgUrl
          ? {
              backgroundImage: `linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url(${customBgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }
          : undefined
      }
    >
      {!customBgUrl && theme.pattern && (
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
      {!isPreview && isAdminView && (
        <div className="relative bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white">
          👁 Visão admin — página pública do evento.
        </div>
      )}
      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {!customBgUrl && Decoration && <Decoration />}

        {!customBgUrl && HeroArt && (
          <div className="mb-4">
            <HeroArt />
          </div>
        )}

        <header className="relative text-center">
          <h1
            className={`text-4xl font-extrabold tracking-tight drop-shadow-sm ${
              themeTextColor ? '' : theme.titleColor
            }`}
            style={themeTextColor ? { color: themeTextColor } : undefined}
          >
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
          cardClass={themeCardClass}
          accent={themeAccent}
          buffetTitle={event.buffet_title}
          buffetDescription={event.buffet_description}
        />

        {/* Colaboradores — quem já presenteou */}
        {collaborators.length > 0 && (
          <section className={`mt-12 rounded-lg p-5 shadow-sm ${themeCardClass}`}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-base text-white"
                style={{ background: themeAccent }}
              >
                💝
              </span>
              <h2 className="text-lg font-semibold">Quem já colaborou</h2>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Um obrigado especial pra todo mundo que ajudou:
            </p>
            <ul className="mt-3 divide-y divide-gray-100">
              {collaborators.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <span className="truncate text-right text-xs text-gray-500">
                    {c.giftTitle}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-12 text-center text-xs text-gray-500">
          Página criada com{' '}
          <Link href="/" className="underline">
            Presente no Pix
          </Link>
        </footer>
      </div>
    </main>
  );
}
