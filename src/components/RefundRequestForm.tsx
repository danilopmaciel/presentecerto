'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { describePixKey, normalizePixKey } from '@/lib/pix-key';

type Submit = (formData: FormData) => Promise<{ error?: string } | void>;

export function RefundRequestForm({
  creditId,
  defaultPixKey,
  onSubmit
}: {
  creditId: string;
  defaultPixKey?: string | null;
  onSubmit: Submit;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [pixKey, setPixKey] = useState(defaultPixKey ?? '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizePixKey(pixKey);
  const kind = describePixKey(pixKey);

  function send() {
    setError(null);
    if (!normalized || normalized.length < 3) {
      setError('Informe uma chave Pix pra receber o reembolso.');
      return;
    }
    const fd = new FormData();
    fd.set('credit_id', creditId);
    fd.set('refund_pix_key', normalized);
    fd.set('refund_note', note);
    startTransition(async () => {
      const res = (await onSubmit(fd)) ?? {};
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-brand-300 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
      >
        Pedir reembolso
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border border-brand-200 bg-brand-50/40 p-3">
      <label className="block text-xs">
        Chave Pix pra receber o reembolso
        <input
          value={pixKey}
          onChange={(e) => setPixKey(e.target.value)}
          placeholder="CPF, e-mail, telefone (com ou sem +55) ou aleatória"
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm"
          autoFocus
        />
      </label>
      {pixKey.trim() && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-700">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium">{kind}</span>
          <span>→</span>
          <span className="break-all font-mono">{normalized}</span>
        </div>
      )}
      <label className="block text-xs">
        Observação (opcional)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Algo que o suporte precisa saber"
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        />
      </label>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={send}
          disabled={pending}
          className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? 'Enviando...' : 'Confirmar pedido'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
      <p className="text-[10px] text-gray-500">
        O reembolso é feito manualmente pela MEI no Pix em até 3 dias úteis.
      </p>
    </div>
  );
}
