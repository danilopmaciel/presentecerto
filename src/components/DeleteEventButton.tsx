'use client';

import { useState, useTransition } from 'react';

export function DeleteEventButton({
  eventTitle,
  onDelete
}: {
  eventTitle: string;
  onDelete: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [pending, startTransition] = useTransition();

  const ready = typed.trim().toLowerCase() === eventTitle.trim().toLowerCase();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm text-red-700 hover:bg-red-50"
      >
        Excluir evento
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-red-300 bg-red-50 p-4">
      <div className="text-sm text-red-900">
        Tem certeza? Esta ação não pode ser desfeita e vai apagar presentes, RSVPs e compras desse
        evento. Para confirmar, digite <strong>{eventTitle}</strong> abaixo.
      </div>
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={eventTitle}
        className="w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!ready || pending}
          onClick={() => startTransition(() => onDelete())}
          className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? 'Excluindo...' : 'Sim, excluir permanentemente'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            setTyped('');
          }}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
