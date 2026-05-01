'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type ChangePlan = (formData: FormData) => Promise<{ error?: string } | void>;

export function PlanSwitcher({
  currentTier,
  paymentStatus,
  onChange
}: {
  currentTier: 'basic' | 'themed';
  paymentStatus: string;
  onChange: ChangePlan;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPaid = paymentStatus === 'paid' || paymentStatus === 'paid_claimed' || paymentStatus === 'waived';
  const target: 'basic' | 'themed' = currentTier === 'basic' ? 'themed' : 'basic';
  const upgrading = target === 'themed';

  function handleSwitch() {
    setError(null);
    const fd = new FormData();
    fd.set('plan_tier', target);
    startTransition(async () => {
      const res = (await onChange(fd)) ?? {};
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1 text-sm">
          <span
            className={`rounded-full px-3 py-1 ${
              currentTier === 'basic'
                ? 'bg-white font-semibold shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Básico — R$ 20
          </span>
          <span
            className={`rounded-full px-3 py-1 ${
              currentTier === 'themed'
                ? 'bg-white font-semibold shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Temático — R$ 50
          </span>
        </div>
        {!isPaid && (
          <button
            type="button"
            onClick={handleSwitch}
            disabled={pending}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              upgrading
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } disabled:opacity-60`}
          >
            {pending
              ? 'Mudando...'
              : upgrading
                ? '↑ Mudar para Temático'
                : '↓ Voltar para Básico'}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {isPaid ? (
        <p className="text-xs text-gray-500">
          Pagamento já confirmado nesse plano. Pra mudar de plano agora, fala com o suporte que a
          gente ajusta a diferença manualmente.
        </p>
      ) : upgrading ? (
        <p className="text-xs text-gray-500">
          Mudar pra Temático libera os 12 temas com hero art e padrões. O Pix do plano vai ser
          atualizado pra R$ 50 (você ainda não pagou).
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          Voltar pro Básico remove o tema personalizado. O Pix do plano volta pra R$ 20.
        </p>
      )}
    </div>
  );
}
