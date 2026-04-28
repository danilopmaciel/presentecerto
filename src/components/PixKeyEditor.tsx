'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { describePixKey, normalizePixKey } from '@/lib/pix-key';

type Save = (formData: FormData) => Promise<{ error?: string; pix_key?: string } | void>;

export function PixKeyEditor({
  current,
  onSave
}: {
  current: string | null;
  onSave: Save;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(current ?? '');
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const normalized = normalizePixKey(draft);
  const kind = describePixKey(draft);
  const changed = normalized !== (current ?? '');

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    if (!normalized) {
      setError('Digite uma chave válida.');
      return;
    }
    const fd = new FormData();
    fd.set('pix_key', normalized);
    startTransition(async () => {
      const res = (await onSave(fd)) ?? {};
      if (res.error) {
        setError(res.error);
        return;
      }
      setOkMsg('Chave Pix atualizada.');
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wide text-gray-500">Chave Pix do anfitrião</div>
          {current ? (
            <div className="break-all font-mono text-sm">{current}</div>
          ) : (
            <div className="text-sm text-red-700">
              Nenhuma chave configurada — convidados não conseguem gerar Pix.
            </div>
          )}
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(current ?? '');
              setEditing(true);
              setOkMsg(null);
              setError(null);
            }}
            className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Editar
          </button>
        )}
      </div>

      {okMsg && (
        <div className="rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-800">
          {okMsg}
        </div>
      )}

      {editing && (
        <form
          onSubmit={handleSave}
          className="space-y-2 rounded-md border-2 border-brand-300 bg-brand-50/40 p-3"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="CPF, CNPJ, e-mail, telefone (com ou sem +55) ou aleatória"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm"
            autoFocus
          />

          {draft.trim() && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white p-2 text-xs">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                {kind}
              </span>
              <span className="text-gray-500">→</span>
              <span className="break-all font-mono text-gray-900">{normalized}</span>
              {normalized !== draft.trim() && (
                <span className="text-[11px] text-gray-500">(formatada automaticamente)</span>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending || !changed || !normalized}
              className="rounded-md bg-brand-500 px-3 py-1.5 text-sm text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {pending ? 'Salvando...' : 'Salvar chave'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(current ?? '');
                setError(null);
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>

          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[11px] text-gray-500">
            <li>Telefone: <code>(14) 99176-0674</code> ou <code>14991760674</code> → vira <code>+5514991760674</code></li>
            <li>CPF/CNPJ: somente os dígitos (sem ponto/traço)</li>
            <li>E-mail: como você usa pra receber</li>
            <li>Aleatória (EVP): UUID copiado do banco, ex.: <code>285f1a82-cd99-4e4f-b136-b1599f0059ed</code></li>
          </ul>
        </form>
      )}
    </div>
  );
}
