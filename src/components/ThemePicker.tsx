'use client';

import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { THEMES } from '@/lib/themes';

export function ThemePicker({
  currentTheme,
  onSelect
}: {
  currentTheme: string;
  onSelect: (themeId: string) => Promise<void>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticTheme, setOptimisticTheme] = useOptimistic(currentTheme);

  function select(themeId: string) {
    if (themeId === optimisticTheme) return;
    startTransition(async () => {
      setOptimisticTheme(themeId);
      await onSelect(themeId);
      router.refresh();
    });
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {THEMES.map((t) => {
        const selected = optimisticTheme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => select(t.id)}
            disabled={pending && !selected}
            className={`overflow-hidden rounded-lg border-2 text-left transition ${
              selected
                ? 'border-brand-500 ring-2 ring-brand-200'
                : 'border-gray-200 hover:border-gray-300'
            } ${pending && !selected ? 'opacity-60' : ''}`}
          >
            <div
              className={`relative h-20 w-full ${t.pageBg}`}
              style={t.pattern ? { backgroundImage: t.pattern } : undefined}
            >
              {t.Decoration && (
                <div className="absolute inset-0 origin-top-right scale-[0.55]">
                  <t.Decoration />
                </div>
              )}
              {selected && (
                <div className="absolute right-1.5 top-1.5 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-medium text-white">
                  ✓ Ativo
                </div>
              )}
            </div>
            <div className="px-3 py-2">
              <div className={`text-sm font-medium ${t.titleColor}`}>{t.name}</div>
              <div className="mt-0.5 text-xs text-gray-500">
                {selected ? 'Aplicado na página' : 'Clique para aplicar'}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
