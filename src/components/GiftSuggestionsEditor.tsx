'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type Suggestion = {
  id: string;
  emoji?: string;
  label: string;
  color?: string; // hex
};

const COLORS = [
  '#fee2e2', // rose
  '#ffedd5', // orange
  '#fef9c3', // yellow
  '#dcfce7', // green
  '#cffafe', // cyan
  '#dbeafe', // blue
  '#ede9fe', // violet
  '#fce7f3' // pink
];

// emojis comuns pra crianças — primeiro caractere do label se vier "👕 Roupa"
const EMOJI_RE = /\p{Extended_Pictographic}/u;

function splitEmoji(input: string): { emoji?: string; label: string } {
  const trimmed = input.trim();
  if (!trimmed) return { label: '' };
  const match = trimmed.match(EMOJI_RE);
  if (match && trimmed.startsWith(match[0])) {
    return {
      emoji: match[0],
      label: trimmed.slice(match[0].length).trimStart()
    };
  }
  return { label: trimmed };
}

function pickColor(seed: number) {
  return COLORS[seed % COLORS.length];
}

type SaveSuggestions = (next: Suggestion[]) => Promise<void>;

export function GiftSuggestionsEditor({
  initial,
  onSave
}: {
  initial: Suggestion[];
  onSave: SaveSuggestions;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Suggestion[]>(initial);
  const [draft, setDraft] = useState('');
  const [pending, startTransition] = useTransition();

  function addOne() {
    const { emoji, label } = splitEmoji(draft);
    if (!label) return;
    const next: Suggestion[] = [
      ...items,
      {
        id: crypto.randomUUID(),
        emoji,
        label,
        color: pickColor(items.length)
      }
    ];
    setItems(next);
    setDraft('');
    startTransition(async () => {
      await onSave(next);
      router.refresh();
    });
  }

  function removeOne(id: string) {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    startTransition(async () => {
      await onSave(next);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.length === 0 && (
          <span className="text-xs text-gray-500">
            Nenhuma sugestão ainda. Adicione abaixo, ex.:{' '}
            <code>👕 Roupa: Tam 3</code>.
          </span>
        )}
        {items.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-gray-800 ring-1 ring-black/5 shadow-sm"
            style={{ background: s.color ?? '#f3f4f6' }}
          >
            {s.emoji && <span>{s.emoji}</span>}
            <span>{s.label}</span>
            <button
              type="button"
              onClick={() => removeOne(s.id)}
              className="-mr-1 ml-1 rounded-full px-1 text-xs text-gray-500 hover:bg-black/10 hover:text-gray-700"
              aria-label={`Remover ${s.label}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addOne();
            }
          }}
          placeholder="Ex.: 👕 Roupa: Tam 3, 👟 Calçado: Tam 23, 🎨 Material de pintura"
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={addOne}
          disabled={pending || !draft.trim()}
          className="shrink-0 rounded-md bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? 'Salvando...' : 'Adicionar'}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Comece com um emoji se quiser destacar (ele aparece na bolinha colorida).
      </p>
    </div>
  );
}
