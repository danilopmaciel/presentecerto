'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { normalizePixKey, describePixKey } from '@/lib/pix-key';

const DRAFT_KEY = 'pc_draft_v1';

type DraftPlan = 'basic' | 'themed';

type Draft = {
  title: string;
  description: string;
  starts_at: string; // ISO datetime-local format
  location_text: string;
  location_maps_url: string;
  plan_tier: DraftPlan;
  pix_key: string;
};

const emptyDraft: Draft = {
  title: '',
  description: '',
  starts_at: '',
  location_text: '',
  location_maps_url: '',
  plan_tier: 'basic',
  pix_key: ''
};

function loadDraft(): Draft {
  if (typeof window === 'undefined') return emptyDraft;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return { ...emptyDraft, ...parsed };
  } catch {
    return emptyDraft;
  }
}

function saveDraft(d: Draft) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
}

export default function CriarPage() {
  // Suspense é exigido pelo Next 15+ pra qualquer client component que use
  // useSearchParams() — senão o build prerender falha.
  return (
    <Suspense fallback={<LoadingShell />}>
      <CriarPageInner />
    </Suspense>
  );
}

function LoadingShell() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-4 w-72 animate-pulse rounded bg-gray-200" />
        <div className="mt-8 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      </div>
    </main>
  );
}

function CriarPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const queryPlan = search.get('plan') === 'themed' ? 'themed' : 'basic';

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loaded, setLoaded] = useState(false);

  // Carrega rascunho do localStorage no primeiro mount
  useEffect(() => {
    const loaded = loadDraft();
    // Se a URL trouxe um plan, ela vence
    setDraft({ ...loaded, plan_tier: queryPlan });
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save em qualquer mudança (depois do primeiro mount)
  useEffect(() => {
    if (!loaded) return;
    saveDraft(draft);
  }, [draft, loaded]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Normaliza Pix antes de salvar
    const normalized = normalizePixKey(draft.pix_key);
    const finalDraft = { ...draft, pix_key: normalized };
    saveDraft(finalDraft);
    // Redireciona pro login — depois do login, /criar/finalizar pega o rascunho
    router.push('/login?next=/criar/finalizar');
  }

  function discardDraft() {
    if (!confirm('Quer mesmo descartar o rascunho? Tudo que você preencheu vai ser perdido.')) {
      return;
    }
    localStorage.removeItem(DRAFT_KEY);
    setDraft({ ...emptyDraft, plan_tier: queryPlan });
  }

  const pixKind = describePixKey(draft.pix_key);
  const pixNormalized = normalizePixKey(draft.pix_key);
  const hasAnyContent =
    !!draft.title.trim() ||
    !!draft.description.trim() ||
    !!draft.starts_at ||
    !!draft.location_text.trim() ||
    !!draft.pix_key.trim();

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white pb-16">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-bold text-brand-700">
          PresenteCerto
        </Link>
        <Link href="/login" className="text-sm text-gray-600 hover:underline">
          Já tenho conta · Entrar
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-6 rounded-xl border border-brand-200 bg-white p-4 text-sm shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">✨</span>
            <div>
              <div className="font-semibold text-gray-900">
                Monte seu evento sem precisar criar conta
              </div>
              <p className="mt-1 text-gray-600">
                Preenche aqui sem compromisso — o login só é pedido na hora de publicar pros
                convidados. O rascunho fica salvo no seu navegador.
              </p>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold sm:text-3xl">Novo evento</h1>
        <p className="mt-1 text-sm text-gray-600">
          Você pode mudar tudo depois — comece pelo essencial.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Plano */}
          <fieldset className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <legend className="px-2 text-sm font-medium text-gray-700">Plano</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <PlanOption
                value="basic"
                selected={draft.plan_tier === 'basic'}
                onSelect={() => update('plan_tier', 'basic')}
                title="Básico"
                price="R$ 20"
                features={['Página do evento', 'Lista de cotas', 'RSVP', 'Painel do anfitrião']}
              />
              <PlanOption
                value="themed"
                selected={draft.plan_tier === 'themed'}
                onSelect={() => update('plan_tier', 'themed')}
                title="Temático"
                price="R$ 50"
                features={[
                  'Tudo do Básico',
                  '12 temas com hero art',
                  'Personalização com sua imagem',
                  'IA pra gerar imagens'
                ]}
                highlight
              />
            </div>
          </fieldset>

          {/* Título */}
          <Field label="Título do evento" required>
            <input
              required
              value={draft.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Ex.: Aniversário do meu filho — 3 anos"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </Field>

          {/* Data e hora */}
          <Field label="Data e hora" required>
            <input
              type="datetime-local"
              required
              value={draft.starts_at}
              onChange={(e) => update('starts_at', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </Field>

          {/* Local */}
          <Field label="Local">
            <input
              value={draft.location_text}
              onChange={(e) => update('location_text', e.target.value)}
              placeholder="Buffet, casa, salão... — endereço completo se quiser"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </Field>

          {/* Link Maps */}
          <Field label="Link do Google Maps (opcional)">
            <input
              type="url"
              value={draft.location_maps_url}
              onChange={(e) => update('location_maps_url', e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </Field>

          {/* Descrição */}
          <Field label="Mensagem aos convidados (opcional)">
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Boas-vindas, dress code, detalhes da festa..."
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </Field>

          {/* Pix */}
          <Field label="Sua chave Pix (para receber os presentes)" required>
            <input
              required
              value={draft.pix_key}
              onChange={(e) => update('pix_key', e.target.value)}
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
            />
            {draft.pix_key.trim() && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium">
                  {pixKind}
                </span>
                <span>→</span>
                <span className="break-all font-mono">{pixNormalized}</span>
                {pixNormalized !== draft.pix_key.trim() && (
                  <span className="text-gray-500">(será salva normalizada)</span>
                )}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Os presentes vão direto pra sua chave — o PresenteCerto não retém o valor.
            </p>
          </Field>

          {/* CTA */}
          <div className="sticky bottom-3 z-10 -mx-4 mt-8 rounded-xl bg-white/95 p-4 shadow-lg ring-1 ring-gray-200 backdrop-blur sm:mx-0">
            <button
              type="submit"
              disabled={!draft.title.trim() || !draft.starts_at || !draft.pix_key.trim()}
              className="block w-full rounded-md bg-brand-500 px-6 py-3 text-center font-semibold text-white shadow hover:bg-brand-600 disabled:opacity-50"
            >
              Continuar →
            </button>
            <p className="mt-2 text-center text-[11px] text-gray-500">
              Próximo passo: criar sua conta (1 minuto) pra adicionar presentes, escolher tema e
              publicar o link.
            </p>
            {hasAnyContent && (
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={discardDraft}
                  className="text-[11px] text-gray-500 hover:text-red-600 hover:underline"
                >
                  Descartar rascunho
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function PlanOption({
  value,
  selected,
  onSelect,
  title,
  price,
  features,
  highlight = false
}: {
  value: DraftPlan;
  selected: boolean;
  onSelect: () => void;
  title: string;
  price: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-plan={value}
      className={`relative rounded-lg border-2 p-3 text-left transition ${
        selected
          ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-200'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {highlight && !selected && (
        <span className="absolute -top-2 right-3 rounded-full bg-brand-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
          Recomendado
        </span>
      )}
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-gray-900">{title}</span>
        <span className="text-base font-bold text-brand-700">{price}</span>
      </div>
      <ul className="mt-2 space-y-0.5 text-[11px] text-gray-600">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-1">
            <span className="text-green-600">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}
