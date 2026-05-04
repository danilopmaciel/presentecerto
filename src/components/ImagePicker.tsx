'use client';

import { useRef, useState } from 'react';
import { uploadEventImage } from '@/lib/upload';
import { AiImageModal } from './AiImageModal';

type Props = {
  value: string;
  onChange: (url: string) => void;
  scope: 'bg' | 'gift';
  /** Permite o botão "🔍 Buscar" que extrai og:image (só faz sentido pra gift) */
  enableUrlFetch?: boolean;
  /** Habilita o botão "✨ Gerar com IA" — exige eventId pra funcionar */
  enableAi?: boolean;
  /** Necessário pro botão IA (a quota é por evento) */
  eventId?: string;
  placeholder?: string;
  className?: string;
};

/**
 * Input de imagem com 3 caminhos:
 *  - Colar URL (e opcionalmente "Buscar imagem" via og:image)
 *  - Selecionar arquivo do dispositivo
 *  - Tirar foto (mobile abre câmera traseira via capture="environment")
 *
 * Faz upload pro bucket event-uploads e devolve a URL pública.
 */
export function ImagePicker({
  value,
  onChange,
  scope,
  enableUrlFetch = false,
  enableAi = false,
  eventId,
  placeholder = 'URL da imagem',
  className
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'fetch' | 'upload' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    setBusy('upload');
    setError(null);
    const res = await uploadEventImage(file, scope);
    setBusy(null);
    if (!res.ok || !res.url) {
      setError(res.error ?? 'Falha no upload.');
      return;
    }
    onChange(res.url);
  }

  async function handleFetchOgImage() {
    const url = value.trim();
    if (!url) {
      setError('Cole um link primeiro.');
      return;
    }
    setBusy('fetch');
    setError(null);
    try {
      const res = await fetch('/api/fetch-og-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Não consegui pegar a imagem.');
        return;
      }
      onChange(json.image_url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <div className="flex flex-wrap gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setError(null);
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        {enableUrlFetch && (
          <button
            type="button"
            onClick={handleFetchOgImage}
            disabled={!!busy || !value.trim()}
            className="shrink-0 rounded-md border border-brand-300 bg-white px-3 py-2 text-sm text-brand-700 hover:bg-brand-50 disabled:opacity-60"
          >
            {busy === 'fetch' ? 'Buscando...' : '🔍 Buscar'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!!busy}
          className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {busy === 'upload' ? 'Enviando...' : '📁 Do dispositivo'}
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={!!busy}
          className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          📷 Tirar foto
        </button>
        {enableAi && (
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            disabled={!!busy || !eventId}
            title={
              !eventId
                ? 'Salve o evento antes de usar IA'
                : 'Gerar imagem por IA a partir de uma descrição'
            }
            className="shrink-0 rounded-md bg-gradient-to-r from-brand-500 to-purple-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
          >
            ✨ Gerar com IA
          </button>
        )}
      </div>

      {enableAi && (
        <AiImageModal
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          onPick={(url) => onChange(url)}
          scope={scope}
          eventId={eventId}
        />
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {value && (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Pré-visualização"
            className="h-32 w-full object-cover"
            onError={() => setError('Imagem não carregou.')}
          />
        </div>
      )}
    </div>
  );
}
