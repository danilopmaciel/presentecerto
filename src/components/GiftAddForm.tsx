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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('image_path', imageUrl);
    startTransition(async () => {
      await onAdd(fd);
      (e.target as HTMLFormElement).reset();
      setImageUrl('');
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

      <div>
        <div className="text-xs text-gray-600">
          Foto: cole o link do produto (Mercado Livre, Amazon...) e clique em{' '}
          <strong>🔍 Buscar</strong>, ou faça upload do dispositivo / tire foto na hora.
        </div>
        <div className="mt-2">
          <ImagePicker
            value={imageUrl}
            onChange={setImageUrl}
            scope="gift"
            enableUrlFetch
            enableAi={enableAi}
            eventId={eventId}
            placeholder="Link da loja ou da imagem"
          />
        </div>
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
