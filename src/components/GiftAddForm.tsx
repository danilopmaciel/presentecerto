'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type AddGift = (formData: FormData) => Promise<void>;

export function GiftAddForm({ onAdd }: { onAdd: AddGift }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  async function fetchPreview() {
    const url = imageUrl.trim();
    if (!url) {
      setPreviewError('Cole um link primeiro.');
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(null);
    try {
      const res = await fetch('/api/fetch-og-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setPreviewError(json.error ?? 'Não consegui pegar a imagem.');
        return;
      }
      setPreviewUrl(json.image_url);
      setImageUrl(json.image_url); // grava a URL final no input
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao buscar';
      setPreviewError(msg);
    } finally {
      setPreviewLoading(false);
    }
  }

  function clearPreview() {
    setPreviewUrl(null);
    setPreviewError(null);
    setImageUrl('');
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // garante que o input image_path tem a URL final (depois do og:image)
    fd.set('image_path', imageUrl);
    startTransition(async () => {
      await onAdd(fd);
      // limpa o form
      (e.target as HTMLFormElement).reset();
      setImageUrl('');
      setPreviewUrl(null);
      setPreviewError(null);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-md border border-dashed border-gray-300 p-4"
    >
      <div className="text-sm font-medium">Adicionar presente</div>

      <input
        name="title"
        required
        placeholder="Ex.: Triciclo — cotas de R$ 50"
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />
      <input
        name="description"
        placeholder="Descrição opcional"
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            name="image_path"
            type="url"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setPreviewError(null);
            }}
            placeholder="Cole o link da loja (Mercado Livre, Amazon...) ou da imagem"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2"
          />
          <button
            type="button"
            onClick={fetchPreview}
            disabled={previewLoading || !imageUrl.trim()}
            className="shrink-0 rounded-md border border-brand-300 bg-white px-3 py-2 text-sm text-brand-700 hover:bg-brand-50 disabled:opacity-60"
          >
            {previewLoading ? 'Buscando...' : '🔍 Buscar imagem'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Cole o link do produto e clique em <strong>Buscar imagem</strong> — a gente extrai a foto
          automaticamente.
        </p>

        {previewError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            {previewError}
          </div>
        )}

        {previewUrl && (
          <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Pré-visualização"
              className="h-20 w-20 shrink-0 rounded object-cover"
              onError={() => {
                setPreviewError('Imagem não carregou.');
                setPreviewUrl(null);
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-gray-700">Pré-visualização</div>
              <div className="mt-1 break-all text-[11px] text-gray-500">{previewUrl}</div>
              <button
                type="button"
                onClick={clearPreview}
                className="mt-1 text-xs text-red-600 hover:underline"
              >
                Remover
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Valor da cota (R$)
          <input
            name="quota_value"
            type="number"
            step="0.01"
            min="1"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Nº de cotas
          <input
            name="quota_total"
            type="number"
            min="1"
            defaultValue={10}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
      </div>
      <button
        disabled={pending}
        className="rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? 'Salvando...' : 'Adicionar'}
      </button>
    </form>
  );
}
