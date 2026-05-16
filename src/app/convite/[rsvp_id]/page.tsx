import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/supabase/server';
import { getTheme } from '@/lib/themes';
import { PrintButton } from './PrintButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ rsvp_id: string }>;
}): Promise<Metadata> {
  const { rsvp_id } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from('rsvps')
    .select('guest_name, events!inner(title)')
    .eq('id', rsvp_id)
    .single();
  if (!data) return { title: 'Convite' };
  const ev = (data as { events: { title: string }[] }).events;
  const title = Array.isArray(ev) ? ev[0]?.title : (ev as unknown as { title: string })?.title;
  return { title: `Convite — ${title ?? ''}` };
}

export default async function ConvitePage({
  params
}: {
  params: Promise<{ rsvp_id: string }>;
}) {
  const { rsvp_id } = await params;
  const admin = createAdminClient();

  const { data: rsvp } = await admin
    .from('rsvps')
    .select(
      'id, guest_name, adults, children, created_at, events!inner(title, starts_at, location_text, theme, plan_tier)'
    )
    .eq('id', rsvp_id)
    .single();

  if (!rsvp) notFound();

  const event = (rsvp as { events: { title: string; starts_at: string; location_text: string | null; theme: string | null; plan_tier: string } } & typeof rsvp).events as {
    title: string;
    starts_at: string;
    location_text: string | null;
    theme: string | null;
    plan_tier: string;
  };

  const themeId = event.plan_tier === 'themed' ? (event.theme ?? 'default') : 'default';
  const theme = getTheme(themeId as Parameters<typeof getTheme>[0]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const conviteUrl = `${siteUrl}/convite/${rsvp_id}`;

  const qrDataUrl = await QRCode.toDataURL(conviteUrl, {
    margin: 2,
    width: 220,
    color: { dark: '#111827', light: '#ffffff' }
  });

  const startDate = new Date(event.starts_at);
  const dateStr = startDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = startDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const shortId = rsvp_id.slice(0, 8).toUpperCase();

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; }
          .print-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Toolbar — escondida na impressão */}
      <div className="no-print flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <a href={`javascript:history.back()`} className="text-sm text-gray-500 hover:text-gray-800">
          ← Voltar
        </a>
        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Meu convite para ${event.title}: ${conviteUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
          >
            📲 Compartilhar no WhatsApp
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Background */}
      <div className={`flex min-h-[calc(100vh-57px)] items-center justify-center p-6 ${theme.pageBg}`}>
        {/* Card */}
        <div
          className="print-card w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* Header com cor do tema */}
          <div
            className="px-8 py-8 text-center text-white"
            style={{
              background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}bb 100%)`
            }}
          >
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">
              Convite de Presença
            </div>
            <div className="mt-3 text-2xl font-extrabold leading-tight">{event.title}</div>
          </div>

          {/* Corpo do convite */}
          <div className="px-8 py-7">
            {/* Informações do evento */}
            <div className="space-y-2.5 text-sm text-gray-600">
              <div className="flex items-start gap-2.5">
                <span className="mt-px text-base">📅</span>
                <span className="capitalize leading-snug">
                  {dateStr}
                  <br />
                  <span className="text-gray-500">às {timeStr}</span>
                </span>
              </div>
              {event.location_text && (
                <div className="flex items-start gap-2.5">
                  <span className="mt-px text-base">📍</span>
                  <span className="leading-snug">{event.location_text}</span>
                </div>
              )}
            </div>

            {/* Divider pontilhado */}
            <div className="my-6 flex items-center gap-2">
              <div className="h-px flex-1 border-t border-dashed border-gray-200" />
              <span className="text-lg">🎉</span>
              <div className="h-px flex-1 border-t border-dashed border-gray-200" />
            </div>

            {/* Convidado */}
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Presença confirmada de
              </div>
              <div className="mt-2 text-2xl font-extrabold text-gray-900">{rsvp.guest_name}</div>
              {(rsvp.adults > 1 || rsvp.children > 0) && (
                <div className="mt-1 text-sm text-gray-500">
                  {rsvp.adults} adulto{rsvp.adults !== 1 ? 's' : ''}
                  {rsvp.children > 0 &&
                    ` · ${rsvp.children} criança${rsvp.children !== 1 ? 's' : ''}`}
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="mt-7 flex flex-col items-center">
              <div
                className="rounded-xl p-3 shadow-inner"
                style={{ background: '#f8fafc', border: `2px solid ${theme.accent}33` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code do convite" width={180} height={180} />
              </div>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-400">
                Apresente este QR code na entrada
                <br />
                para registrar sua chegada
              </p>
            </div>

            {/* ID curto */}
            <div className="mt-5 flex justify-center">
              <span
                className="rounded-full px-3 py-1 font-mono text-[10px] font-semibold text-gray-500"
                style={{ background: `${theme.accent}15` }}
              >
                #{shortId}
              </span>
            </div>
          </div>

          {/* Rodapé */}
          <div
            className="px-8 py-4 text-center text-[10px] text-white/70"
            style={{ background: theme.accent }}
          >
            Gerado pelo PresenteCerto · presentecerto.com.br
          </div>
        </div>
      </div>
    </>
  );
}
