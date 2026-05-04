'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePicker } from './ImagePicker';
import { extractPalette, type Palette } from '@/lib/colors';

type Save = (formData: FormData) => Promise<{ error?: string } | void>;

export function CustomThemeEditor({
  currentBgUrl,
  currentPalette,
  onSave,
  onClear,
  eventId
}: {
  currentBgUrl: string | null;
  currentPalette: Palette | null;
  onSave: Save;
  onClear: () => Promise<void>;
  eventId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [bgUrl, setBgUrl] = useState(currentBgUrl ?? '');
  const [palette, setPalette] = useState<Palette | null>(currentPalette);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accentOverride, setAccentOverride] = useState<string | null>(null);

  // Quando a URL muda, re-extrai a paleta
  useEffect(() => {
    if (!bgUrl) {
      setPalette(null);
      setAccentOverride(null);
      return;
    }
    if (currentBgUrl === bgUrl && currentPalette) {
      setPalette(currentPalette);
      return;
    }
    let cancelled = false;
    setExtracting(true);
    setError(null);
    extractPalette(bgUrl)
      .then((p) => {
        if (!cancelled) {
          setPalette(p);
          setAccentOverride(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            'Não consegui extrair a paleta da imagem. Verifique se ela carrega corretamente.'
          );
          // Log no console pra debug
          // eslint-disable-next-line no-console
          console.error('extractPalette failed', e);
        }
      })
      .finally(() => {
        if (!cancelled) setExtracting(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgUrl]);

  const finalPalette: Palette | null = palette
    ? {
        ...palette,
        accent: accentOverride ?? palette.accent
      }
    : null;

  function save() {
    setError(null);
    if (!bgUrl) {
      setError('Faça upload de uma imagem primeiro.');
      return;
    }
    if (!finalPalette) {
      setError('Aguarde a extração da paleta terminar.');
      return;
    }
    const fd = new FormData();
    fd.set('bg_url', bgUrl);
    fd.set('palette', JSON.stringify(finalPalette));
    startTransition(async () => {
      const res = (await onSave(fd)) ?? {};
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function clear() {
    startTransition(async () => {
      await onClear();
      setBgUrl('');
      setPalette(null);
      setAccentOverride(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-medium text-gray-700">Imagem de fundo</div>
        <p className="mt-1 text-[11px] text-gray-500">
          Carrega uma foto da festa, do tema escolhido ou qualquer arte que você quiser. A gente
          extrai as cores automaticamente da imagem.
        </p>
        <div className="mt-3">
          <ImagePicker
            value={bgUrl}
            onChange={setBgUrl}
            scope="bg"
            enableAi
            eventId={eventId}
            placeholder="Cole a URL ou faça upload"
          />
        </div>
      </div>

      {extracting && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          🎨 Extraindo paleta...
        </div>
      )}

      {finalPalette && !extracting && (
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <div className="text-xs font-medium text-gray-700">Paleta extraída</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Swatch label="Destaque" color={finalPalette.accent} editable />
            <Swatch label="Fundo card" color={finalPalette.bg} />
            <Swatch label="Texto" color={finalPalette.text} />
          </div>
          {/* permite override do accent via color picker */}
          <div className="mt-3 flex items-center gap-2">
            <label className="text-[11px] text-gray-600">Ajustar destaque:</label>
            <input
              type="color"
              value={finalPalette.accent}
              onChange={(e) => setAccentOverride(e.target.value)}
              className="h-7 w-10 cursor-pointer rounded border border-gray-300"
            />
            <button
              type="button"
              onClick={() => setAccentOverride(null)}
              className="text-[11px] text-brand-600 hover:underline"
            >
              Voltar pro automático
            </button>
          </div>

          {/* Pré-visualização ao vivo */}
          <div
            className="mt-4 overflow-hidden rounded-md border border-gray-200"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url(${bgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="px-4 py-6 text-center">
              <div className="text-xl font-extrabold" style={{ color: finalPalette.text }}>
                Aniversário do Theo
              </div>
              <div
                className="mt-3 inline-block rounded-md px-4 py-2 text-xs font-medium text-white"
                style={{ background: finalPalette.accent }}
              >
                Confirmar presença ✅
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending || !bgUrl || !finalPalette}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? 'Salvando...' : 'Salvar tema personalizado'}
        </button>
        {currentBgUrl && (
          <button
            type="button"
            onClick={clear}
            disabled={pending}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Remover personalização
          </button>
        )}
      </div>
    </div>
  );
}

function Swatch({
  label,
  color,
  editable
}: {
  label: string;
  color: string;
  editable?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1 pl-1 pr-3">
      <div
        className="h-6 w-6 shrink-0 rounded-full border border-white shadow-sm"
        style={{ background: color }}
      />
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wide text-gray-500">{label}</span>
        <span className="font-mono text-[11px] text-gray-700">
          {color.toUpperCase()}
          {editable && <span className="ml-1 text-[9px] text-brand-600">(ajustável)</span>}
        </span>
      </div>
    </div>
  );
}
