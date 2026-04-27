import type { Suggestion } from './GiftSuggestionsEditor';

export function GiftSuggestionsDisplay({
  suggestions,
  accent
}: {
  suggestions: Suggestion[];
  accent?: string;
}) {
  if (!suggestions.length) return null;

  return (
    <section className="mt-6 rounded-lg border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-base"
          style={{ background: accent ?? '#fb7185', color: 'white' }}
        >
          🎁
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-900">
          Sugestões de presente
        </h3>
      </div>
      <p className="mt-1 text-xs text-rose-900/80">
        Se preferir levar um mimo no dia, aqui vão algumas ideias do anfitrião:
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-black/5"
            style={{ background: s.color ?? '#fee2e2' }}
          >
            {s.emoji && <span>{s.emoji}</span>}
            <span>{s.label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
