'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatBRL } from '@/lib/utils';
import { ImagePicker } from './ImagePicker';

export type GiftRowData = {
  id: string;
  title: string;
  description: string | null;
  image_path: string | null;
  quota_value_cents: number;
  quota_total: number;
  kind?: 'gift' | 'buffet';
};

type Update = (formData: FormData) => Promise<void>;
type Delete = (formData: FormData) => Promise<{ error?: string } | void>;

export function GiftRow({
  gift,
  sold,
  onUpdate,
  onDelete,
  eventId,
  enableAi = false,
  enableBuffet = false
}: {
  gift: GiftRowData;
  sold: number;
  onUpdate: Update;
  onDelete: Delete;
  eventId?: string;
  enableAi?: boolean;
  enableBuffet?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [imageUrl, setImageUrl] = useState(gift.image_path ?? '');
  // Se o plano é Básico mas o item já existia como buffet (legado), mantém o kind
  // pra não quebrar dados. Só esconde o seletor de tipo no UI.
  const [kind, setKind] = useState<'gift' | 'buffet'>(gift.kind ?? 'gift');
  const [error, setError] = useState<string | null>(null);
  const isBuffet = kind === 'buffet';

  function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('image_path', imageUrl);
    fd.set('gift_id', gift.id);
    fd.set('kind', kind);
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
        <div className="text-sm font-medium text-brand-900">
          Editando {isBuffet ? 'item de buffet' : 'presente'}
        </div>

        {/* Seletor de tipo — só no plano Temático */}
        {enableBuffet && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKind('gift')}
              className={`flex items-center gap-2 rounded-md border-2 px-3 py-2 text-left text-xs ${
                !isBuffet
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-base">🎁</span>
              <span className="font-medium">Presente</span>
            </button>
            <button
              type="button"
              onClick={() => setKind('buffet')}
              className={`flex items-center gap-2 rounded-md border-2 px-3 py-2 text-left text-xs ${
                isBuffet
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-base">🍽️</span>
              <span className="font-medium">Buffet</span>
            </button>
          </div>
        )}

        <input
          name="title"
          required
          defaultValue={gift.title}
          placeholder={isBuffet ? 'Ex.: Buffet adulto' : 'Título do presente'}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
        />
        <input
          name="description"
          defaultValue={gift.description ?? ''}
          placeholder="Descrição opcional"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
        />

        <div>
          <ImagePicker
            value={imageUrl}
            onChange={setImageUrl}
            scope="gift"
            enableUrlFetch={!isBuffet}
            enableAi={enableAi}
            eventId={eventId}
            placeholder={isBuffet ? 'URL da foto (opcional)' : 'URL da foto ou link do produto'}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            {isBuffet ? 'Valor por pessoa (R$)' : 'Valor da cota (R$)'}
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
          {isBuffet ? (
            <input type="hidden" name="quota_total" value={gift.quota_total || 999999} />
          ) : (
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
          )}
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
              setError(null);
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
          <div className="flex items-center gap-2">
            <div className="font-medium">{gift.title}</div>
            {gift.kind === 'buffet' && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                🍽️ Buffet
              </span>
            )}
          </div>
          {gift.description && (
            <div className="text-xs text-gray-500">{gift.description}</div>
          )}
          <div className="text-sm text-gray-500">
            {gift.kind === 'buffet'
              ? `${formatBRL(gift.quota_value_cents)} / pessoa`
              : `${formatBRL(gift.quota_value_cents)} / cota — ${sold} de ${gift.quota_total} vendidas`}
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
