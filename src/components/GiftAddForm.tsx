'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePicker } from './ImagePicker';

type AddGift = (formData: FormData) => Promise<void>;

export function GiftAddForm({
  onAdd,
  eventId,
  enableAi = false
}: {
  onAdd: AddGift;
  eventId?: string;
  enableAi?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState('');
  const [kind, setKind] = useState<'gift' | 'buffet'>('gift');

  const isBuffet = kind === 'buffet';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('image_path', imageUrl);
    fd.set('kind', kind);
    startTransition(async () => {
      await onAdd(fd);
      (e.target as HTMLFormElement).reset();
      setImageUrl('');
      setKind('gift');
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-md border border-dashed border-gray-300 p-4"
    >
      <div className="text-sm font-medium">Adicionar item</div>

      {/* Seletor de tipo */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-gray-600">
          Tipo
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setKind('gift')}
            className={`flex items-center gap-2 rounded-md border-2 px-3 py-2 text-left text-sm ${
              !isBuffet
                ? 'border-brand-500 bg-brand-50 text-brand-800'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className="text-lg">🎁</span>
            <div className="min-w-0">
              <div className="font-medium leading-tight">Presente</div>
              <div className="text-[10px] leading-tight text-gray-500">
                Convidados dividem em cotas
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setKind('buffet')}
            className={`flex items-center gap-2 rounded-md border-2 px-3 py-2 text-left text-sm ${
              isBuffet
                ? 'border-brand-500 bg-brand-50 text-brand-800'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className="text-lg">🍽️</span>
            <div className="min-w-0">
              <div className="font-medium leading-tight">Buffet / Contribuição</div>
              <div className="text-[10px] leading-tight text-gray-500">
                Valor por pessoa (adulto/criança)
              </div>
            </div>
          </button>
        </div>
        {isBuffet && (
          <p className="mt-2 text-[11px] text-gray-500">
            Dica: cria dois itens — <strong>Buffet adulto</strong> e <strong>Buffet criança</strong>{' '}
            — pra que o convidado pré-preencha automaticamente a quantidade baseada no RSVP.
          </p>
        )}
      </div>

      <input
        name="title"
        required
        placeholder={
          isBuffet ? 'Ex.: Buffet adulto' : 'Ex.: Triciclo — cotas de R$ 50'
        }
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />
      <input
        name="description"
        placeholder="Descrição opcional"
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />

      <div>
        <div className="text-xs text-gray-600">
          {isBuffet
            ? 'Foto (opcional): se não enviar, mostramos um ícone de buffet automático.'
            : 'Foto: cole o link do produto e clique em 🔍 Buscar, ou faça upload do dispositivo / tire foto na hora.'}
        </div>
        <div className="mt-2">
          <ImagePicker
            value={imageUrl}
            onChange={setImageUrl}
            scope="gift"
            enableUrlFetch={!isBuffet}
            enableAi={enableAi}
            eventId={eventId}
            placeholder={
              isBuffet ? 'URL da foto (opcional)' : 'Link da loja ou da imagem'
            }
          />
        </div>
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
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          {isBuffet ? 'Vagas (lugares no buffet)' : 'Nº de cotas'}
          <input
            name="quota_total"
            type="number"
            min="1"
            defaultValue={isBuffet ? 30 : 10}
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
