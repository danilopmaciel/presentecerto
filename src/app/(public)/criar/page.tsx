'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { normalizePixKey, describePixKey } from '@/lib/pix-key';
import { createClient } from '@/lib/supabase/client';
import { finalizeDraft } from './actions';

const DRAFT_KEY = 'pc_draft_v1';

type DraftPlan = 'basic' | 'themed';

type DraftGift = {
  id: string;
  title: string;
  description: string;
  kind: 'gift' | 'buffet';
  quota_value: number; // BRL, not cents
  quota_total: number;
};

type Draft = {
  title: string;
  description: string;
  starts_at: string; // ISO datetime-local format
  location_text: string;
  location_maps_url: string;
  plan_tier: DraftPlan;
  pix_key: string;
  gifts: DraftGift[];
};

const emptyDraft: Draft = {
  title: '',
  description: '',
  starts_at: '',
  location_text: '',
  location_maps_url: '',
  plan_tier: 'basic',
  pix_key: '',
  gifts: []
};

function loadDraft(): Draft {
  if (typeof window === 'undefined') return emptyDraft;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return { ...emptyDraft, ...parsed, gifts: Array.isArray(parsed.gifts) ? parsed.gifts : [] };
  } catch {
    return emptyDraft;
  }
}

function newGiftId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
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

type AuthStatus = 'idle' | 'google-loading' | 'email-loading' | 'email-sent';
type SubmitStage = 'idle' | 'submitting' | 'error';

function CriarPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const queryPlan = search.get('plan') === 'themed' ? 'themed' : 'basic';

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loaded, setLoaded] = useState(false);

  // Estado de autenticação
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileComplete, setProfileComplete] = useState(false);

  // Estado dos fluxos secundários
  const [submitStage, setSubmitStage] = useState<SubmitStage>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authEmail, setAuthEmail] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Carrega rascunho do localStorage e estado de auth no mount
  useEffect(() => {
    const stored = loadDraft();
    setDraft({ ...stored, plan_tier: queryPlan });
    setLoaded(true);

    (async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setUserId(null);
        setAuthChecking(false);
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      const fullName = profile?.full_name ?? '';
      const phone = profile?.phone ?? '';
      setProfileFullName(fullName);
      setProfilePhone(phone);
      const hasName = fullName.trim().length >= 2;
      const hasPhone = phone.replace(/\D/g, '').length >= 10;
      setProfileComplete(hasName && hasPhone);
      setAuthChecking(false);
    })();
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

  function formIsValid() {
    return !!draft.title.trim() && !!draft.starts_at && !!draft.pix_key.trim();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formIsValid()) return;

    // Normaliza Pix antes de salvar
    const normalized = normalizePixKey(draft.pix_key);
    const finalDraft = { ...draft, pix_key: normalized };
    setDraft(finalDraft);
    saveDraft(finalDraft);

    if (authChecking) return; // aguarda a checagem de auth concluir

    // Não logada/o → rola pra seção de login inline
    if (!userId) {
      requestAnimationFrame(() => {
        document
          .getElementById('inline-auth')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    // Logada/o sem nome/telefone → rola pra seção de cadastro
    if (!profileComplete) {
      requestAnimationFrame(() => {
        document
          .getElementById('inline-profile')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    // Tudo certo → finaliza
    await finalize(finalDraft, profileFullName, profilePhone);
  }

  async function finalize(d: Draft, fullName: string, phone: string) {
    setSubmitStage('submitting');
    setSubmitError(null);
    const res = await finalizeDraft({
      ...d,
      full_name: fullName,
      phone,
      gifts: d.gifts
    });
    if ('error' in res) {
      setSubmitError(res.error ?? 'Erro desconhecido ao criar evento.');
      setSubmitStage('error');
      return;
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    router.replace(`/app/eventos/${res.event_id}`);
  }

  async function handleGoogleLogin() {
    setAuthStatus('google-loading');
    setAuthError(null);
    const supabase = createClient();
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', '/criar');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.toString() }
    });
    if (error) {
      setAuthError(error.message);
      setAuthStatus('idle');
    }
    // sucesso → o navegador é redirecionado pro Google
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setAuthStatus('email-loading');
    setAuthError(null);
    const supabase = createClient();
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', '/criar');
    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail,
      options: { emailRedirectTo: callback.toString() }
    });
    if (error) {
      setAuthError(error.message);
      setAuthStatus('idle');
    } else {
      setAuthStatus('email-sent');
    }
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileFullName.trim() || profileFullName.trim().length < 2) {
      setSubmitError('Informe seu nome completo.');
      return;
    }
    if (profilePhone.replace(/\D/g, '').length < 10) {
      setSubmitError('Informe um telefone válido com DDD.');
      return;
    }
    setSubmitError(null);
    finalize(draft, profileFullName.trim(), profilePhone.trim());
  }

  function discardDraft() {
    if (!confirm('Quer mesmo descartar o rascunho? Tudo que você preencheu vai ser perdido.')) {
      return;
    }
    localStorage.removeItem(DRAFT_KEY);
    setDraft({ ...emptyDraft, plan_tier: queryPlan });
  }

  function addGift(gift: Omit<DraftGift, 'id'>) {
    setDraft((d) => ({ ...d, gifts: [...d.gifts, { ...gift, id: newGiftId() }] }));
  }

  function removeGift(id: string) {
    setDraft((d) => ({ ...d, gifts: d.gifts.filter((g) => g.id !== id) }));
  }

  const pixKind = describePixKey(draft.pix_key);
  const pixNormalized = normalizePixKey(draft.pix_key);
  const hasAnyContent =
    !!draft.title.trim() ||
    !!draft.description.trim() ||
    !!draft.starts_at ||
    !!draft.location_text.trim() ||
    !!draft.pix_key.trim();

  // Texto do botão muda conforme o stage do usuário
  let ctaLabel = 'Continuar →';
  if (submitStage === 'submitting') ctaLabel = 'Criando evento...';
  else if (!authChecking && userId && profileComplete) ctaLabel = 'Criar meu evento →';

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white pb-16">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-bold text-brand-700">
          PresenteCerto
        </Link>
        {!userId && !authChecking && (
          <Link href="/login" className="text-sm text-gray-600 hover:underline">
            Já tenho conta · Entrar
          </Link>
        )}
        {userId && (
          <Link href="/app" className="text-sm text-gray-600 hover:underline">
            Meu painel
          </Link>
        )}
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-6 rounded-xl border border-brand-200 bg-white p-4 text-sm shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">✨</span>
            <div>
              <div className="font-semibold text-gray-900">
                {userId
                  ? `Bem-vinda/o de volta${userEmail ? `, ${userEmail}` : ''}`
                  : 'Monte seu evento sem precisar criar conta'}
              </div>
              <p className="mt-1 text-gray-600">
                {userId
                  ? 'Termine de preencher e publique seu evento — vai direto pro seu painel.'
                  : 'Preenche aqui sem compromisso — o login só é pedido na hora de publicar pros convidados. O rascunho fica salvo no seu navegador.'}
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
                  'Buffet / contribuição por pessoa',
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

          {/* Lista de presentes */}
          <GiftSection
            gifts={draft.gifts}
            planTier={draft.plan_tier}
            onAdd={addGift}
            onRemove={removeGift}
          />

          {/* Seção de auth inline — só aparece quando não tá logado */}
          {!authChecking && !userId && (
            <section
              id="inline-auth"
              className="rounded-xl border border-brand-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">🔐</span>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">
                    Faça login pra publicar (1 minuto)
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Seu rascunho já está salvo. Só precisamos identificar você antes de criar a
                    página do evento.
                  </p>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={authStatus !== 'idle'}
                    className="mt-4 flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {authStatus === 'google-loading'
                      ? 'Redirecionando...'
                      : 'Entrar com Google'}
                  </button>

                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">
                      ou
                    </span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  <form onSubmit={handleMagicLink} className="space-y-2">
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={authStatus !== 'idle'}
                      className="w-full rounded-md bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-60"
                    >
                      {authStatus === 'email-loading'
                        ? 'Enviando...'
                        : 'Receber link por e-mail'}
                    </button>
                  </form>

                  {authStatus === 'email-sent' && (
                    <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                      Link enviado! Confira seu e-mail (pode ir pro spam). Volte aqui depois de
                      clicar no link — o rascunho já está salvo.
                    </div>
                  )}
                  {authError && (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                      {authError}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Seção de cadastro inline — quando tá logado mas faltam dados */}
          {!authChecking && userId && !profileComplete && (
            <section
              id="inline-profile"
              className="rounded-xl border border-brand-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">📇</span>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">Última etapa: seu cadastro</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Pra criarmos seu evento precisamos do seu nome e telefone — usados só pra
                    suporte e notificações de pagamento.
                  </p>

                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                        Nome completo
                      </span>
                      <input
                        required
                        value={profileFullName}
                        onChange={(e) => setProfileFullName(e.target.value)}
                        placeholder="Como você se apresenta"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                        Telefone (WhatsApp)
                      </span>
                      <input
                        required
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleProfileSubmit}
                      disabled={submitStage === 'submitting'}
                      className="w-full rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                    >
                      {submitStage === 'submitting'
                        ? 'Criando evento...'
                        : 'Criar meu evento →'}
                    </button>
                    {submitError && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                        {submitError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* CTA fixa no rodapé */}
          <div className="sticky bottom-3 z-10 -mx-4 mt-8 rounded-xl bg-white/95 p-4 shadow-lg ring-1 ring-gray-200 backdrop-blur sm:mx-0">
            <button
              type="submit"
              disabled={!formIsValid() || submitStage === 'submitting'}
              className="block w-full rounded-md bg-brand-500 px-6 py-3 text-center font-semibold text-white shadow hover:bg-brand-600 disabled:opacity-50"
            >
              {ctaLabel}
            </button>
            {!authChecking && !userId && (
              <p className="mt-2 text-center text-[11px] text-gray-500">
                Próximo passo: login rápido (1 minuto) pra publicar pros convidados.
              </p>
            )}
            {!authChecking && userId && !profileComplete && (
              <p className="mt-2 text-center text-[11px] text-gray-500">
                Próximo passo: completar nome e telefone (3 segundos).
              </p>
            )}
            {!authChecking && userId && profileComplete && (
              <p className="mt-2 text-center text-[11px] text-gray-500">
                Após criar, você vai pro painel pra adicionar presentes e publicar.
              </p>
            )}
            {submitStage === 'error' && submitError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-center text-xs text-red-700">
                {submitError}
              </div>
            )}
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

function GiftSection({
  gifts,
  planTier,
  onAdd,
  onRemove
}: {
  gifts: DraftGift[];
  planTier: DraftPlan;
  onAdd: (g: Omit<DraftGift, 'id'>) => void;
  onRemove: (id: string) => void;
}) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [kind, setKind] = React.useState<'gift' | 'buffet'>('gift');
  const [quotaValue, setQuotaValue] = React.useState('');
  const [quotaTotal, setQuotaTotal] = React.useState('10');
  const [open, setOpen] = React.useState(false);

  const isBuffet = planTier === 'themed' && kind === 'buffet';

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(quotaValue);
    const total = isBuffet ? 999999 : Math.max(1, parseInt(quotaTotal, 10) || 1);
    if (!title.trim() || isNaN(val) || val <= 0) return;
    onAdd({ title: title.trim(), description: description.trim(), kind, quota_value: val, quota_total: total });
    setTitle('');
    setDescription('');
    setQuotaValue('');
    setQuotaTotal('10');
    setKind('gift');
    setOpen(false);
  }

  return (
    <fieldset className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <legend className="px-2 text-sm font-medium text-gray-700">Lista de presentes</legend>

      {gifts.length === 0 && !open && (
        <p className="text-sm text-gray-500">
          Nenhum presente adicionado ainda — você pode adicionar agora ou depois de criar o evento.
        </p>
      )}

      {gifts.length > 0 && (
        <ul className="mb-3 divide-y divide-gray-100">
          {gifts.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{g.kind === 'buffet' ? '🍽️' : '🎁'}</span>
                  <span className="truncate text-sm font-medium text-gray-900">{g.title}</span>
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {g.kind === 'buffet'
                    ? `R$ ${g.quota_value.toFixed(2).replace('.', ',')} por pessoa`
                    : `R$ ${g.quota_value.toFixed(2).replace('.', ',')} × ${g.quota_total} cota(s)`}
                  {g.description ? ` · ${g.description}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(g.id)}
                className="shrink-0 text-xs text-red-500 hover:text-red-700"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <form onSubmit={handleAdd} className="mt-2 space-y-3 rounded-md border border-dashed border-gray-300 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Novo item</div>

          {planTier === 'themed' && (
            <div className="grid grid-cols-2 gap-2">
              {(['gift', 'buffet'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`flex items-center gap-2 rounded-md border-2 px-3 py-2 text-left text-sm ${
                    kind === k
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{k === 'buffet' ? '🍽️' : '🎁'}</span>
                  <span className="font-medium">{k === 'buffet' ? 'Buffet / Contribuição' : 'Presente'}</span>
                </button>
              ))}
            </div>
          )}

          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isBuffet ? 'Ex.: Buffet adulto' : 'Ex.: Triciclo'}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição opcional"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              {isBuffet ? 'Valor por pessoa (R$)' : 'Valor da cota (R$)'}
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={quotaValue}
                onChange={(e) => setQuotaValue(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            {!isBuffet && (
              <label className="block text-sm">
                Nº de cotas
                <input
                  required
                  type="number"
                  min="1"
                  value={quotaTotal}
                  onChange={(e) => setQuotaTotal(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-brand-500 px-4 py-1.5 text-sm text-white hover:bg-brand-600"
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 text-sm text-brand-600 hover:underline"
        >
          + Adicionar presente
        </button>
      )}
    </fieldset>
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
