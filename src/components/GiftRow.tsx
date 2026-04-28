'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatBRL } from '@/lib/utils';

export type GiftRowData = {
  id: string;
  title: string;
  description: string | null;
  image_path: string | null;
  quota_value_cents: number;
  quota_total: number;
};

type Update = (formData: FormData) => Promise<void>;
type Delete = (formData: FormData) => Promise<{ error?: string } | void>;

export function GiftRow({
  gift,
  sold,
  onUpdate,
  onDelete
}: {
  gift: GiftRowData;
  sold: number;
  onUpdate: Update;
  onDelete: Delete;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [imageUrl, setImageUrl] = useState(gift.image_path ?? '');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchPreview() {
    const url = imageUrl.trim();
    if (!url) return;
    setPreviewLoading(true);
    setPreviewError(null);
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
      setImageUrl(json.image_url);
    } catch (e: unknown) {
      setPreviewError(e instanceof Error ? e.message : 'Erro ao buscar');
    } finally {
      setPreviewLoading(false);
    }
  }

  function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('image_path', imageUrl);
    fd.set('gift_id', gift.id);
    startTransition(async () => {
      await onUpdate(fd);
      setEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    setError(null);
    const fd = new FormData();
    fd.set('gift_id', gift.id);
    startTransition(async () => {
      const res = (await onDelete(fd)) ?? {};
      if (res.error) {
        setError(res.error);
        return;
      }
      setConfirmDel(false);
      router.refresh();
    });
  }

  const hasSales = sold > 0;

  if (editing) {
    return (
      <form
        onSubmit={submitEdit}
        className="space-y-3 rounded-md border-2 border-brand-300 bg-brand-50/40 p-4"
      >
        <div className="text-sm font-medium text-brand-900">Editando presente</div>
        <input
          name="title"
          required
          defaultValue={gift.title}
          placeholder="Título"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
        />
        <input
          name="description"
          defaultValue={gift.description ?? ''}
          placeholder="Descrição opcional"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
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
              placeholder="URL da foto ou link do produto"
              className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2"
            />
            <button
              type="button"
              onClick={fetchPreview}
              disabled={previewLoading || !imageUrl.trim()}
              className="shrink-0 rounded-md border border-brand-300 bg-white px-3 py-2 text-sm text-brand-700 hover:bg-brand-50 disabled:opacity-60"
            >
              {previewLoading ? 'Buscando...' : '🔍 Buscar'}
            </button>
          </div>
          {previewError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {previewError}
            </div>
          )}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="prévia"
              className="h-20 w-20 rounded object-cover"
              onError={() => setPreviewError('Imagem não carregou.')}
            />
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
              defaultValue={(gift.quota_value_cents / 100).toFixed(2)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Nº de cotas
            <input
              name="quota_total"
              type="number"
              min={Math.max(1, sold)}
              required
              defaultValue={gift.quota_total}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            />
            {hasSales && (
              <span className="mt-1 block text-[11px] text-gray-500">
                Mínimo {sold} (já vendidas).
              </span>
            )}
          </label>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setImageUrl(gift.image_path ?? '');
              setPreviewError(null);
            }}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-4">
        {gift.image_path && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gift.image_path}
            alt={gift.title}
            className="h-16 w-16 shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium">{gift.title}</div>
          {gift.description && (
            <div className="text-xs text-gray-500">{gift.description}</div>
          )}
          <div className="text-sm text-gray-500">
            {formatBRL(gift.quota_value_cents)} / cota — {sold} de {gift.quota_total} vendidas
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            ✏️ Editar
          </button>
          <button
            type="button"
            onClick={() => setConfirmDel(true)}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            🗑️ Excluir
          </button>
        </div>
      </div>

      {confirmDel && (
        <div className="mt-3 space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-900">
            Excluir <strong>{gift.title}</strong>?
            {hasSales && (
              <>
                {' '}
                <span className="font-semibold">
                  Já tem {sold} cota(s) vendida(s)/reservada(s).
                </span>{' '}
                Você não pode excluir presentes com cotas ativas — cancele as compras antes ou
                marque como esgotado deixando o nº de cotas igual ao já vendido.
              </>
            )}
          </p>
          {error && <div className="text-xs text-red-700">{error}</div>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || hasSales}
              onClick={handleDelete}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {pending ? 'Excluindo...' : 'Sim, excluir'}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDel(false);
                setError(null);
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
