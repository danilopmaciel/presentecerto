'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { THEMES, getTheme } from '@/lib/themes';
import { formatBRL } from '@/lib/utils';

type Gift = {
  id: string;
  title: string;
  description: string | null;
  image_path: string;
  quota_value_cents: number;
  quota_total: number;
  reserved: number;
};

type Suggestion = {
  emoji: string;
  label: string;
  color: string;
};

type DemoEvent = {
  title: string;
  description: string;
  starts_at_label: string;
  location_text: string;
};

// Pix payload de exemplo (chave aleatória + valor R$ 50,00) — só pra renderizar o QR no demo
const DEMO_PIX_PAYLOAD =
  '00020126580014BR.GOV.BCB.PIX0136demo-presentecerto-12345-67890-abc52040000530398654040.005802BR5913PRESENTECERTO6009SAO PAULO62070503***6304ABCD';

export function DemoEventPreview({
  event,
  gifts,
  suggestions,
  initialThemeId
}: {
  event: DemoEvent;
  gifts: Gift[];
  suggestions: Suggestion[];
  initialThemeId: string;
}) {
  const [themeId, setThemeId] = useState(initialThemeId);
  const [pixOpen, setPixOpen] = useState<{ giftTitle: string; amount: number } | null>(null);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const theme = getTheme(themeId);
  const HeroArt = theme.HeroArt;
  const Decoration = theme.Decoration;

  useEffect(() => {
    let cancel = false;
    QRCode.toDataURL(DEMO_PIX_PAYLOAD, { margin: 1, width: 220 })
      .then((url) => {
        if (!cancel) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <>
      {/* Theme switcher */}
      <div className="mx-auto -mb-2 max-w-2xl px-6 pt-6">
        <div className="rounded-xl border border-brand-200 bg-white/90 p-3 shadow-sm backdrop-blur">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              🎨 Experimente os 12 temas
            </div>
            <span className="text-[10px] text-gray-500">Plano Temático · R$ 50</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {THEMES.map((t) => {
              const selected = t.id === themeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={`group shrink-0 overflow-hidden rounded-md border-2 transition ${
                    selected
                      ? 'border-brand-500 ring-2 ring-brand-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={t.name}
                >
                  <div
                    className={`relative h-12 w-20 ${t.pageBg}`}
                    style={t.pattern ? { backgroundImage: t.pattern } : undefined}
                  >
                    {t.HeroArt ? (
                      <div className="absolute inset-0 -translate-y-1 scale-[0.5] origin-center">
                        <t.HeroArt />
                      </div>
                    ) : t.Decoration ? (
                      <div className="absolute inset-0 origin-top-right scale-[0.4]">
                        <t.Decoration />
                      </div>
                    ) : null}
                  </div>
                  <div className="bg-white px-1 py-0.5 text-[9px] font-medium text-gray-700">
                    {t.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section className={`relative overflow-hidden ${theme.pageBg}`}>
        {theme.pattern && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{ backgroundImage: theme.pattern }}
          />
        )}
        <div className="relative mx-auto max-w-2xl px-6 py-10">
          {Decoration && <Decoration />}
          {HeroArt && (
            <div className="mb-4">
              <HeroArt />
            </div>
          )}

          <header className="relative text-center">
            <h1
              className={`text-4xl font-extrabold tracking-tight drop-shadow-sm ${theme.titleColor}`}
            >
              {event.title}
            </h1>
            <p className="mt-2 text-gray-700">{event.starts_at_label}</p>
            <p className="mt-1 text-gray-600">{event.location_text}</p>
            <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
              {event.description}
            </p>
          </header>

          {/* Sugestões */}
          <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-base text-white"
                style={{ background: theme.accent }}
              >
                🎁
              </span>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-900">
                Sugestões de presente
              </h3>
            </div>
            <p className="mt-1 text-xs text-rose-900/80">
              Se preferir levar um mimo no dia, aqui vão algumas ideias:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-black/5"
                  style={{ background: s.color }}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* RSVP button */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setRsvpOpen(true)}
              className="block w-full rounded-2xl px-6 py-5 text-center text-lg font-semibold text-white shadow-lg ring-2 ring-white/40 transition hover:scale-[1.01] hover:shadow-xl active:scale-[0.99]"
              style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`
              }}
            >
              Clique aqui para confirmar presença ✅
            </button>
            <p className="mt-1 text-center text-[11px] text-gray-500">
              Pode clicar — é demonstração
            </p>
          </div>

          {/* Lista de presentes */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Lista de presentes</h2>
            <p className="text-sm text-gray-600">
              Cada presente é dividido em cotas. Você escolhe quantas quer presentear.
            </p>
            <div className="mt-4 space-y-3">
              {gifts.map((g) => {
                const soldOut = g.reserved >= g.quota_total;
                const pct = Math.min(100, Math.round((g.reserved / g.quota_total) * 100));
                return (
                  <div
                    key={g.id}
                    className={`relative rounded-lg p-4 shadow-sm ${theme.cardClass} ${
                      soldOut ? 'overflow-hidden' : ''
                    }`}
                    style={{ borderLeft: `4px solid ${theme.accent}` }}
                  >
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.image_path}
                        alt={g.title}
                        className={`h-20 w-20 shrink-0 rounded-md object-cover ${
                          soldOut ? 'opacity-60 grayscale' : ''
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{g.title}</div>
                          {soldOut && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                              Esgotado
                            </span>
                          )}
                        </div>
                        {g.description && (
                          <div className="text-sm text-gray-600">{g.description}</div>
                        )}
                        <div className="mt-1 text-sm text-gray-500">
                          {formatBRL(g.quota_value_cents)} / cota
                          {!soldOut && ` · ${g.quota_total - g.reserved} cotas disponíveis`}
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[11px] text-gray-600">
                            <span>
                              {g.reserved} de {g.quota_total} cotas
                            </span>
                            <span className="font-medium">{pct}%</span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}aa)`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      {!soldOut && (
                        <button
                          type="button"
                          onClick={() =>
                            setPixOpen({
                              giftTitle: g.title,
                              amount: g.quota_value_cents
                            })
                          }
                          className="shrink-0 rounded-md px-3 py-1.5 text-sm text-white shadow-sm hover:opacity-90"
                          style={{ background: theme.accent }}
                        >
                          Presentear
                        </button>
                      )}
                    </div>
                    {soldOut && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                        <div
                          className="select-none rounded-md border-4 border-red-600 px-4 py-1 text-xl font-extrabold tracking-widest text-red-600 shadow-lg"
                          style={{
                            transform: 'rotate(-18deg)',
                            background: 'rgba(255,255,255,0.85)',
                            letterSpacing: '0.15em'
                          }}
                        >
                          ESGOTADO
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>

      {/* Modal: RSVP */}
      {rsvpOpen && (
        <DemoModal onClose={() => setRsvpOpen(false)} title="Confirmar presença">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Aqui o convidado preenche nome, e-mail, telefone, quantidade de adultos/crianças e
              observações. Tudo salvo no painel do anfitrião em tempo real.
            </p>
            <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
              {[
                'Seu nome',
                'E-mail (opcional)',
                'Telefone/WhatsApp (opcional)'
              ].map((p) => (
                <div
                  key={p}
                  className="rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-400"
                >
                  {p}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  Adultos: 2
                </div>
                <div className="rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  Crianças: 1
                </div>
              </div>
            </div>
            <p className="text-xs text-brand-700">
              No seu evento, o anfitrião vê esses confirmados na hora 👀
            </p>
          </div>
        </DemoModal>
      )}

      {/* Modal: Pix */}
      {pixOpen && (
        <DemoModal
          onClose={() => setPixOpen(null)}
          title={`Presentear: ${pixOpen.giftTitle}`}
        >
          <div className="space-y-3">
            <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
              <p className="font-medium text-gray-700">Como pagar:</p>
              <p className="mt-1">
                <strong>No celular:</strong> abre o app do banco, {'"'}Pagar com Pix{'"'} → {'"'}Ler QR Code{'"'}.
              </p>
              <p className="mt-1">
                <strong>No computador:</strong> copia o código Pix e cola no app do banco.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
              {qrDataUrl && (
                <div className="mx-auto sm:mx-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="QR Code Pix de exemplo"
                    className="h-40 w-40 rounded-md border border-gray-200 bg-white p-1"
                  />
                  <p className="mt-1 text-center text-[10px] text-gray-500">
                    QR de exemplo — não cobra
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">
                  Total: <strong>{formatBRL(pixOpen.amount)}</strong>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-2 font-mono text-[10px] text-gray-600 break-all">
                  {DEMO_PIX_PAYLOAD.slice(0, 80)}...
                </div>
                <div className="rounded-md bg-brand-100 px-3 py-2 text-center text-xs font-medium text-brand-800">
                  📋 Copiar código Pix
                </div>
                <div className="rounded-md border border-dashed border-gray-300 bg-white p-2 text-[11px] text-gray-600">
                  Depois de pagar, o convidado clica em <strong>{'"'}Já paguei{'"'}</strong> e o anfitrião
                  é avisado pra confirmar.
                </div>
              </div>
            </div>
            <p className="text-xs text-brand-700">
              Pix vai direto pra chave do anfitrião. Sem taxa, sem intermediário.
            </p>
          </div>
        </DemoModal>
      )}
    </>
  );
}

function DemoModal({
  onClose,
  title,
  children
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="mt-3">{children}</div>
        <div className="mt-4 flex flex-col items-center gap-2 border-t border-gray-100 pt-4">
          <a
            href="/login?create=1&plan=themed"
            className="block w-full rounded-md bg-brand-500 px-4 py-2.5 text-center text-sm font-medium text-white shadow hover:bg-brand-600"
          >
            Quero o meu evento assim →
          </a>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:underline"
          >
            Continuar explorando o exemplo
          </button>
        </div>
      </div>
    </div>
  );
}
