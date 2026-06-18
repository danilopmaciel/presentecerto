'use client';

import { useState } from 'react';

const SUGGESTIONS_BG = [
  'festa unicórnio rosa pastel com nuvens e arco-íris',
  'festa carros e pista de corrida com bandeira xadrez',
  'festa espaço com foguete, planetas e estrelas',
  'festa princesa com castelo dourado e flores',
  'festa dinossauros pré-históricos com vulcão',
  'festa pirata com navio e mapa do tesouro'
];

const SUGGESTIONS_GIFT = [
  'triciclo infantil colorido com estilo cartoon',
  'caixa de blocos de montar coloridos',
  'kit de pintura infantil com tintas e pincéis',
  'mochila escolar com estampa divertida',
  'pelúcia de urso fofa em fundo branco',
  'bola de futebol em pacote de presente'
];

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
  scope: 'bg' | 'gift';
  eventId?: string;
};

export function AiImageModal({ open, onClose, onPick, scope, eventId }: Props) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<{ msg: string; helpUrl?: string } | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [result, setResult] = useState<{
    url: string;
    used: number;
    limit: number;
    remaining: number;
  } | null>(null);

  if (!open) return null;

  const suggestions = scope === 'bg' ? SUGGESTIONS_BG : SUGGESTIONS_GIFT;

  async function generate() {
    setError(null);
    setResult(null);
    if (!prompt.trim()) {
      setError({ msg: 'Descreva o que você quer.' });
      return;
    }
    if (!eventId) {
      setError({ msg: 'Salve o evento primeiro pra usar a IA.' });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), event_id: eventId, scope })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError({
          msg: json.error ?? 'Falha na geração.',
          helpUrl: json.help_url
        });
        if (json.limit_reached) setLimitReached(true);
        return;
      }
      setResult({
        url: json.image_url,
        used: json.used,
        limit: json.limit,
        remaining: json.remaining
      });
    } catch (e: unknown) {
      setError({ msg: e instanceof Error ? e.message : 'Erro inesperado.' });
    } finally {
      setGenerating(false);
    }
  }

  function use() {
    if (!result) return;
    onPick(result.url);
    handleClose();
  }

  async function requestMore() {
    if (!eventId || requesting || requested) return;
    setRequesting(true);
    try {
      const res = await fetch('/api/ai-credits/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event_id: eventId })
      });
      if (res.ok) setRequested(true);
    } catch {
      // silencioso — botão volta a ficar disponível
    } finally {
      setRequesting(false);
    }
  }

  function handleClose() {
    setPrompt('');
    setResult(null);
    setError(null);
    setGenerating(false);
    setLimitReached(false);
    setRequesting(false);
    setRequested(false);
    onClose();
  }

  const requestButton = (
    <button
      type="button"
      onClick={requestMore}
      disabled={requesting || requested}
      className="w-full rounded-md border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-70"
    >
      {requested
        ? '✓ Pedido enviado — o suporte vai liberar mais créditos'
        : requesting
          ? 'Enviando pedido...'
          : '✨ Solicitar mais créditos de IA'}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <span className="text-xl">✨</span> Gerar imagem com IA
            </h3>
            <p className="mt-0.5 text-xs text-gray-600">
              Descreve o que quer e a IA cria. Funciona melhor com cenas simples e cores claras.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar"
            className="shrink-0 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {!result && (
          <>
            <div className="mt-4">
              <label className="text-xs font-medium text-gray-700">
                {scope === 'bg' ? 'Tema da festa' : 'O que é o presente'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={
                  scope === 'bg'
                    ? 'Ex.: festa de aniversário com tema espacial, foguetes e planetas coloridos'
                    : 'Ex.: triciclo infantil colorido, ilustração estilo cartoon'
                }
                className="mt-1 w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                autoFocus
              />
              <div className="mt-1 text-right text-[10px] text-gray-400">
                {prompt.length}/500
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Sugestões — clique pra usar
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPrompt(s)}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-3 space-y-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <div>{error.msg}</div>
                {error.helpUrl && (
                  <a
                    href={error.helpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-md bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-700"
                  >
                    Abrir Google AI Studio →
                  </a>
                )}
              </div>
            )}

            {limitReached && <div className="mt-3">{requestButton}</div>}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={generate}
                disabled={generating || !prompt.trim()}
                className="flex-1 rounded-md bg-gradient-to-r from-brand-500 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-95 disabled:opacity-60"
              >
                {generating ? '✨ Gerando... (~10s)' : '✨ Gerar imagem'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>

            <p className="mt-3 text-[10px] text-gray-500">
              Há um limite de gerações por evento. Acabou? Dá pra solicitar mais. Funciona só no plano Temático.
            </p>
          </>
        )}

        {result && (
          <div className="mt-4 space-y-3">
            <div className="overflow-hidden rounded-lg border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="Imagem gerada"
                className="w-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Usadas: <strong>{result.used}/{result.limit}</strong>
              </span>
              <span>Sobram {result.remaining} ✨</span>
            </div>
            {result.remaining <= 0 && requestButton}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={use}
                className="flex-1 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-600"
              >
                ✓ Usar esta imagem
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                disabled={result.remaining <= 0}
                className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Tentar outra
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
