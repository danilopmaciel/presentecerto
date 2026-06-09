'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { THEMES, getTheme } from '@/lib/themes';
import { formatBRL } from '@/lib/utils';

type DraftGift = {
  id: string;
  title: string;
  description: string;
  kind: 'gift' | 'buffet';
  quota_value: number;
  quota_total: number;
  image_url: string;
};

type DraftSuggestion = {
  id: string;
  emoji?: string;
  label: string;
  color?: string;
};

type PreviewDraft = {
  title: string;
  description: string;
  starts_at: string;
  location_text: string;
  plan_tier: 'basic' | 'themed';
  theme: string;
  gifts: DraftGift[];
  suggestions: DraftSuggestion[];
};

// Pix payload de exemplo só pra renderizar o QR no preview (não cobra nada)
const DEMO_PIX_PAYLOAD =
  '00020126580014BR.GOV.BCB.PIX0136demo-presentenopix-12345-67890-abc52040000530398654040.005802BR5913PRESENTENOPIX6009SAO PAULO62070503***6304ABCD';

function formatDateLabel(iso: string): string {
  if (!iso) return 'Data a definir';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Data a definir';
  return d.toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function DraftPreview({
  draft,
  onThemeChange,
  onClose
}: {
  draft: PreviewDraft;
  onThemeChange: (themeId: string) => void;
  onClose: () => void;
}) {
  const [pixOpen, setPixOpen] = useState<{ giftTitle: string; amount: number } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [aiInfoOpen, setAiInfoOpen] = useState(false);

  const isThemed = draft.plan_tier === 'themed';
  const theme = getTheme(isThemed ? draft.theme : 'default');
  const HeroArt = theme.HeroArt;
  const Decoration = theme.Decoration;

  useEffect(() => {
    let cancel = false;
    QRCode.toDataURL(DEMO_PIX_PAYLOAD, { margin: 1, width: 220 })
      .then((url) => { if (!cancel) setQrDataUrl(url); })
      .catch(() => {});
    return () => { cancel = true; };
  }, []);

  // Bloqueia scroll do body enquanto o preview está aberto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const title = draft.title.trim() || 'Título do seu evento';
  const suggestions = draft.suggestions.filter((s) => s.label.trim());
  const gifts = draft.gifts.filter((g) => g.title.trim());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      {/* Barra superior do preview */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
            👁 Prévia
          </span>
          <span className="hidden sm:inline text-gray-500">É assim que seus convidados vão ver</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-brand-600"
        >
          ← Voltar a editar
        </button>
      </div>

      {/* Seletor de temas (só plano Temático) */}
      {isThemed && (
        <div className="mx-auto -mb-2 max-w-2xl px-6 pt-6">
          <div className="rounded-xl border border-brand-200 bg-white/90 p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                🎨 Experimente os 12 temas
              </div>
              <span className="text-[10px] text-gray-500">Clique pra trocar</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {/* Card "Com IA" — bloqueado: disponível após login + plano Temático */}
              <button
                type="button"
                onClick={() => setAiInfoOpen((v) => !v)}
                className={`group relative shrink-0 overflow-hidden rounded-md border-2 transition ${
                  aiInfoOpen ? 'border-purple-500 ring-2 ring-purple-200' : 'border-dashed border-purple-300 hover:border-purple-500'
                }`}
                title="Tema personalizado com IA — disponível após login"
              >
                <div className="relative flex h-12 w-20 items-center justify-center bg-gradient-to-br from-brand-100 via-purple-100 to-pink-100">
                  <span className="text-2xl">✨</span>
                  <span className="absolute right-0.5 top-0.5 text-[10px]">🔒</span>
                </div>
                <div className="bg-white px-1 py-0.5 text-[9px] font-medium text-purple-700">Com IA</div>
              </button>

              {THEMES.map((t) => {
                const selected = t.id === draft.theme;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onThemeChange(t.id)}
                    className={`group shrink-0 overflow-hidden rounded-md border-2 transition ${
                      selected ? 'border-brand-500 ring-2 ring-brand-200' : 'border-gray-200 hover:border-gray-300'
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
                    <div className="bg-white px-1 py-0.5 text-[9px] font-medium text-gray-700">{t.name}</div>
                  </button>
                );
              })}
            </div>

            {/* Aviso sobre IA / imagem própria */}
            {aiInfoOpen ? (
              <div className="mt-2 rounded-lg border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900">
                <div className="font-semibold">✨ Tema personalizado com IA</div>
                <p className="mt-1 text-purple-800">
                  Depois de criar sua conta e ativar o plano <strong>Temático (R$ 50)</strong>, você
                  desbloqueia: gerar um fundo único só descrevendo a festa (ex.: <em>&quot;festa
                  espacial com foguetes&quot;</em>), enviar sua própria imagem e a paleta de cores sai
                  automática. Por aqui já dá pra escolher entre os <strong>12 temas prontos</strong> —
                  o login só é pedido na hora de publicar.
                </p>
              </div>
            ) : (
              <p className="mt-1.5 text-[10px] text-gray-500">
                🔒 <strong>Com IA</strong> e imagem própria: disponíveis após login + plano Temático. Toque pra saber mais.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Página pública renderizada */}
      <section className={`relative overflow-hidden ${theme.pageBg}`}>
        {theme.pattern && (
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: theme.pattern }} />
        )}
        <div className="relative mx-auto max-w-2xl px-6 py-10">
          {Decoration && <Decoration />}
          {HeroArt && <div className="mb-4"><HeroArt /></div>}

          <header className="relative text-center">
            <h1 className={`text-4xl font-extrabold tracking-tight drop-shadow-sm ${theme.titleColor}`}>
              {title}
            </h1>
            <p className="mt-2 capitalize text-gray-700">{formatDateLabel(draft.starts_at)}</p>
            {draft.location_text.trim() && <p className="mt-1 text-gray-600">{draft.location_text}</p>}
            {draft.description.trim() && (
              <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{draft.description}</p>
            )}
          </header>

          {/* Sugestões */}
          {suggestions.length > 0 && (
            <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-base text-white" style={{ background: theme.accent }}>
                  🎁
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-900">Sugestões de presente</h3>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-black/5"
                    style={{ background: s.color ?? '#f3f4f6' }}
                  >
                    {s.emoji && <span>{s.emoji}</span>}
                    <span>{s.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* RSVP */}
          <div className="mt-8">
            <button
              type="button"
              disabled
              className="block w-full cursor-default rounded-2xl px-6 py-5 text-center text-lg font-semibold text-white shadow-lg ring-2 ring-white/40"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)` }}
            >
              Clique aqui para confirmar presença ✅
            </button>
            <p className="mt-1 text-center text-[11px] text-gray-500">Na página real, o convidado confirma presença aqui</p>
          </div>

          {/* Lista de presentes */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Lista de presentes</h2>
            {gifts.length === 0 ? (
              <p className="mt-2 rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                Nenhum presente ainda. Volte e adicione itens na lista.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Cada presente é dividido em cotas. O convidado escolhe quantas quer presentear.
                </p>
                <div className="mt-4 space-y-3">
                  {gifts.map((g) => (
                    <div
                      key={g.id}
                      className={`relative rounded-lg p-4 shadow-sm ${theme.cardClass}`}
                      style={{ borderLeft: `4px solid ${theme.accent}` }}
                    >
                      <div className="flex items-center gap-4">
                        {g.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={g.image_url} alt={g.title} className="h-20 w-20 shrink-0 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-gray-100 text-3xl">
                            {g.kind === 'buffet' ? '🍽️' : '🎁'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{g.title}</div>
                          {g.description && <div className="text-sm text-gray-600">{g.description}</div>}
                          <div className="mt-1 text-sm text-gray-500">
                            {formatBRL(Math.round(g.quota_value * 100))}
                            {g.kind === 'buffet' ? ' / pessoa' : ` / cota · ${g.quota_total} cotas`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPixOpen({ giftTitle: g.title, amount: Math.round(g.quota_value * 100) })}
                          className="shrink-0 rounded-md px-3 py-1.5 text-sm text-white shadow-sm hover:opacity-90"
                          style={{ background: theme.accent }}
                        >
                          Presentear
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </section>

      {/* Modal Pix (demo) */}
      {pixOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">Presentear: {pixOpen.giftTitle}</h3>
              <button type="button" onClick={() => setPixOpen(null)} aria-label="Fechar" className="rounded-md p-1 text-gray-500 hover:bg-gray-100">✕</button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR Pix exemplo" className="mx-auto h-40 w-40 rounded-md border border-gray-200 bg-white p-1 sm:mx-0" />
              )}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Total: <strong>{formatBRL(pixOpen.amount)}</strong></div>
                <div className="rounded-md bg-brand-100 px-3 py-2 text-center text-xs font-medium text-brand-800">📋 Copiar código Pix</div>
                <p className="text-[11px] text-gray-600">Pix vai direto pra chave do anfitrião. Sem taxa, sem intermediário.</p>
              </div>
            </div>
            <div className="mt-4 border-t border-gray-100 pt-3 text-center text-[11px] text-gray-500">
              Isto é uma demonstração — não cobra nada.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
