'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { normalizePixKey, describePixKey } from '@/lib/pix-key';
import { createClient } from '@/lib/supabase/client';
import { finalizeDraft } from './actions';
import { DraftPreview } from './DraftPreview';

const DRAFT_KEY = 'pc_draft_v2';

type DraftPlan = 'basic' | 'themed';

type DraftGift = {
  id: string;
  title: string;
  description: string;
  kind: 'gift' | 'buffet';
  quota_value: number;
  quota_total: number;
  image_url: string;
};

type DraftSuggestion = {
  id: string;
  emoji?: string;
  label: string;
  color?: string;
};

type Draft = {
  title: string;
  description: string;
  starts_at: string;
  location_text: string;
  location_maps_url: string;
  plan_tier: DraftPlan;
  pix_key: string;
  theme: string;
  gifts: DraftGift[];
  suggestions: DraftSuggestion[];
};

const emptyDraft: Draft = {
  title: '',
  description: '',
  starts_at: '',
  location_text: '',
  location_maps_url: '',
  plan_tier: 'basic',
  pix_key: '',
  theme: 'default',
  gifts: [],
  suggestions: []
};

function emptyGift(): Omit<DraftGift, 'id'> {
  return { title: '', description: '', kind: 'gift', quota_value: 0, quota_total: 10, image_url: '' };
}

function loadDraft(): Draft {
  if (typeof window === 'undefined') return emptyDraft;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return {
      ...emptyDraft,
      ...parsed,
      theme: parsed.theme ?? 'default',
      gifts: Array.isArray(parsed.gifts) ? parsed.gifts : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    };
  } catch {
    return emptyDraft;
  }
}

function saveDraft(d: Draft) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
}

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
}

const SUGGESTION_COLORS = [
  '#fee2e2', '#ffedd5', '#fef9c3', '#dcfce7',
  '#cffafe', '#dbeafe', '#ede9fe', '#fce7f3'
];

const EMOJI_RE = /\p{Extended_Pictographic}/u;

function splitEmoji(input: string): { emoji?: string; label: string } {
  const trimmed = input.trim();
  if (!trimmed) return { label: '' };
  const match = trimmed.match(EMOJI_RE);
  if (match && trimmed.startsWith(match[0])) {
    return { emoji: match[0], label: trimmed.slice(match[0].length).trimStart() };
  }
  return { label: trimmed };
}

export default function CriarPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <CriarPageInner />
    </Suspense>
  );
}

function LoadingShell() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-gray-200" />
        ))}
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

  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileComplete, setProfileComplete] = useState(false);

  const [submitStage, setSubmitStage] = useState<SubmitStage>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authEmail, setAuthEmail] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const stored = loadDraft();
    setDraft({ ...stored, plan_tier: queryPlan });
    setLoaded(true);

    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUserId(null); setAuthChecking(false); return; }
      setUserId(user.id);
      setUserEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, pix_key')
        .eq('id', user.id)
        .single();

      const fullName = profile?.full_name ?? '';
      const phone = profile?.phone ?? '';
      setProfileFullName(fullName);
      setProfilePhone(phone);
      setProfileComplete(fullName.trim().length >= 2 && phone.replace(/\D/g, '').length >= 10);

      // Pre-fill pix from profile if draft is empty
      if (!stored.pix_key && profile?.pix_key) {
        setDraft((d) => ({ ...d, pix_key: profile.pix_key ?? '' }));
      }
      setAuthChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function handleCta() {
    if (!formIsValid()) {
      document.getElementById('section-info')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const normalized = normalizePixKey(draft.pix_key);
    const finalDraft = { ...draft, pix_key: normalized };
    setDraft(finalDraft);
    saveDraft(finalDraft);

    if (authChecking) return;

    if (!userId) {
      document.getElementById('inline-auth')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (!profileComplete) {
      document.getElementById('inline-profile')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    await finalize(finalDraft, profileFullName, profilePhone);
  }

  async function finalize(d: Draft, fullName: string, phone: string) {
    setSubmitStage('submitting');
    setSubmitError(null);
    const res = await finalizeDraft({ ...d, full_name: fullName, phone, gifts: d.gifts, suggestions: d.suggestions, theme: d.theme });
    if ('error' in res) {
      setSubmitError(res.error ?? 'Erro desconhecido ao criar evento.');
      setSubmitStage('error');
      return;
    }
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
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
    if (error) { setAuthError(error.message); setAuthStatus('idle'); }
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
    if (error) { setAuthError(error.message); setAuthStatus('idle'); }
    else setAuthStatus('email-sent');
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileFullName.trim() || profileFullName.trim().length < 2) { setSubmitError('Informe seu nome completo.'); return; }
    if (profilePhone.replace(/\D/g, '').length < 10) { setSubmitError('Informe um telefone válido com DDD.'); return; }
    setSubmitError(null);
    finalize(draft, profileFullName.trim(), profilePhone.trim());
  }

  function discardDraft() {
    if (!confirm('Quer mesmo descartar o rascunho? Tudo que você preencheu vai ser perdido.')) return;
    localStorage.removeItem(DRAFT_KEY);
    setDraft({ ...emptyDraft, plan_tier: queryPlan });
  }

  function addGift(gift: Omit<DraftGift, 'id'>) {
    setDraft((d) => ({ ...d, gifts: [...d.gifts, { ...gift, id: newId() }] }));
  }
  function removeGift(id: string) {
    setDraft((d) => ({ ...d, gifts: d.gifts.filter((g) => g.id !== id) }));
  }

  function addSuggestion(text: string) {
    const { emoji, label } = splitEmoji(text);
    if (!label) return;
    const next: DraftSuggestion = {
      id: newId(),
      emoji,
      label,
      color: SUGGESTION_COLORS[draft.suggestions.length % SUGGESTION_COLORS.length]
    };
    setDraft((d) => ({ ...d, suggestions: [...d.suggestions, next] }));
  }
  function removeSuggestion(id: string) {
    setDraft((d) => ({ ...d, suggestions: d.suggestions.filter((s) => s.id !== id) }));
  }

  const pixKind = describePixKey(draft.pix_key);
  const pixNormalized = normalizePixKey(draft.pix_key);
  const hasAnyContent = !!draft.title.trim() || !!draft.description.trim() || !!draft.starts_at || !!draft.location_text.trim() || !!draft.pix_key.trim() || draft.gifts.length > 0;

  let ctaLabel = 'Continuar →';
  if (submitStage === 'submitting') ctaLabel = 'Criando evento...';
  else if (!authChecking && userId && profileComplete) ctaLabel = 'Criar meu evento →';

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-bold text-brand-700">Presente no Pix</Link>
          <div className="flex items-center gap-4">
            {!userId && !authChecking && (
              <Link href="/login" className="text-sm text-gray-600 hover:underline">Já tenho conta · Entrar</Link>
            )}
            {userId && (
              <Link href="/app" className="text-sm text-gray-600 hover:underline">← Meus eventos</Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-6">

        {/* Título da página */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{draft.title || 'Novo evento'}</h1>
            {draft.starts_at && (
              <p className="text-sm text-gray-500">
                {new Date(draft.starts_at).toLocaleString('pt-BR')}
                {draft.location_text ? ` · ${draft.location_text}` : ''}
              </p>
            )}
          </div>
          {!authChecking && !userId && (
            <div className="shrink-0 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500">
              Rascunho salvo no navegador
            </div>
          )}
        </div>

        {/* Banner informativo */}
        <div className="rounded-xl border border-brand-200 bg-white p-4 text-sm shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">✨</span>
            <div>
              <div className="font-semibold text-gray-900">
                {userId ? `Bem-vinda/o${userEmail ? `, ${userEmail}` : ''}` : 'Monte seu evento sem precisar criar conta'}
              </div>
              <p className="mt-1 text-gray-600">
                {userId
                  ? 'Preencha tudo e publique — vai direto pro seu painel após criar.'
                  : 'Preenche aqui sem compromisso — o login só é pedido na hora de publicar. O rascunho fica salvo no seu navegador.'}
              </p>
            </div>
          </div>
        </div>

        {/* Botão de prévia — experiência completa da página pública */}
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-300 bg-gradient-to-r from-brand-50 to-purple-50 px-4 py-3 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-400 hover:shadow"
        >
          👁 Pré-visualizar a página
          {draft.plan_tier === 'themed' && <span className="font-normal text-gray-500">· experimente os 12 temas</span>}
        </button>

        {/* ── Seção: Informações do evento ── */}
        <section id="section-info" className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Informações do evento</h2>
          <p className="mt-1 text-sm text-gray-600">Você pode mudar tudo depois — comece pelo essencial.</p>

          <div className="mt-4 space-y-4">
            <Field label="Título do evento" required>
              <input
                required
                value={draft.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Ex.: Aniversário do meu filho — 3 anos"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </Field>

            <Field label="Data e hora" required>
              <input
                type="datetime-local"
                required
                value={draft.starts_at}
                onChange={(e) => update('starts_at', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </Field>

            <Field label="Local">
              <input
                value={draft.location_text}
                onChange={(e) => update('location_text', e.target.value)}
                placeholder="Buffet, casa, salão... — endereço completo se quiser"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </Field>

            <Field label="Link do Google Maps (opcional)">
              <input
                type="url"
                value={draft.location_maps_url}
                onChange={(e) => update('location_maps_url', e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </Field>

            <Field label="Mensagem aos convidados (opcional)">
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Boas-vindas, dress code, detalhes da festa..."
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </Field>
          </div>
        </section>

        {/* ── Seção: Configuração de pagamento ── */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Configuração de pagamento</h2>
          <p className="mt-1 text-sm text-gray-600">
            Os presentes vão direto pra sua chave Pix — o Presente no Pix não retém o valor. Confira que a chave está no formato certo antes de divulgar a página.
          </p>

          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">Chave Pix do anfitrião</div>
            <input
              required
              value={draft.pix_key}
              onChange={(e) => update('pix_key', e.target.value)}
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
            />
            {draft.pix_key.trim() && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium">{pixKind}</span>
                <span>→</span>
                <span className="break-all font-mono">{pixNormalized}</span>
                {pixNormalized !== draft.pix_key.trim() && (
                  <span className="text-gray-500">(será salva normalizada)</span>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">Plano</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
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
                features={['Tudo do Básico', '12 temas com hero art', 'Personalização com sua imagem', 'Buffet / contribuição por pessoa', 'IA pra gerar imagens']}
                highlight
              />
            </div>
          </div>
        </section>

        {/* ── Seção: Lista de presentes ── */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Lista de presentes (cotas)</h2>
          <p className="mt-1 text-sm text-gray-600">
            Adicione os presentes agora ou depois de criar o evento. Cada item tem um valor de cota e número de cotas disponíveis.
          </p>
          <div className="mt-4">
            <GiftListSection
              gifts={draft.gifts}
              planTier={draft.plan_tier}
              onAdd={addGift}
              onRemove={removeGift}
            />
          </div>
        </section>

        {/* ── Seção: Sugestões de presente ── */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Sugestões de presente (sem cota)</h2>
          <p className="mt-1 text-sm text-gray-600">
            Ideias rápidas pros convidados que preferem levar um mimo no dia (roupas, calçado, materiais...). Aparecem como bolinhas coloridas na página pública.
          </p>
          <div className="mt-4">
            <SuggestionsSection
              suggestions={draft.suggestions}
              onAdd={addSuggestion}
              onRemove={removeSuggestion}
            />
          </div>
        </section>

        {/* ── Auth inline (deslogado) ── */}
        {!authChecking && !userId && (
          <section id="inline-auth" className="rounded-xl border border-brand-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl">🔐</span>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">Faça login pra publicar (1 minuto)</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Seu rascunho já está salvo. Só precisamos identificar você antes de criar a página do evento.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authStatus !== 'idle'}
                  className="mt-4 flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {authStatus === 'google-loading' ? 'Redirecionando...' : 'Entrar com Google'}
                </button>

                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">ou</span>
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
                    {authStatus === 'email-loading' ? 'Enviando...' : 'Receber link por e-mail'}
                  </button>
                </form>

                {authStatus === 'email-sent' && (
                  <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                    Link enviado! Confira seu e-mail (pode ir pro spam). Volte aqui depois de clicar no link — o rascunho já está salvo.
                  </div>
                )}
                {authError && (
                  <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">{authError}</div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Perfil inline (logado sem nome/telefone) ── */}
        {!authChecking && userId && !profileComplete && (
          <section id="inline-profile" className="rounded-xl border border-brand-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl">📇</span>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">Última etapa: seu cadastro</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Pra criarmos seu evento precisamos do seu nome e telefone — usados só pra suporte e notificações de pagamento.
                </p>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Nome completo</span>
                    <input
                      required
                      value={profileFullName}
                      onChange={(e) => setProfileFullName(e.target.value)}
                      placeholder="Como você se apresenta"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Telefone (WhatsApp)</span>
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
                    {submitStage === 'submitting' ? 'Criando evento...' : 'Criar meu evento →'}
                  </button>
                  {submitError && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{submitError}</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* ── CTA fixo no rodapé ── */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:px-6">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={handleCta}
            disabled={!formIsValid() || submitStage === 'submitting'}
            className="block w-full rounded-md bg-brand-500 px-6 py-3 text-center font-semibold text-white shadow hover:bg-brand-600 disabled:opacity-50"
          >
            {ctaLabel}
          </button>
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-[11px] text-gray-500">
              {!authChecking && !userId && 'Próximo passo: login rápido (1 minuto) pra publicar.'}
              {!authChecking && userId && !profileComplete && 'Próximo passo: completar nome e telefone.'}
              {!authChecking && userId && profileComplete && 'Após criar, você vai pro painel pra adicionar presentes e publicar.'}
            </p>
            {hasAnyContent && (
              <button
                type="button"
                onClick={discardDraft}
                className="text-[11px] text-gray-400 hover:text-red-600 hover:underline"
              >
                Descartar rascunho
              </button>
            )}
          </div>
          {submitStage === 'error' && submitError && (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-center text-xs text-red-700">{submitError}</div>
          )}
        </div>
      </div>

      {/* Overlay de prévia da página pública */}
      {previewOpen && (
        <DraftPreview
          draft={draft}
          onThemeChange={(id) => update('theme', id)}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </main>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function GiftListSection({
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<'gift' | 'buffet'>('gift');
  const [quotaValue, setQuotaValue] = useState('');
  const [quotaTotal, setQuotaTotal] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [fetchBusy, setFetchBusy] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const isBuffet = planTier === 'themed' && kind === 'buffet';

  async function handleFetchImage() {
    const url = imageUrl.trim();
    if (!url) return;
    setFetchBusy(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/fetch-og-image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFetchError(json.error ?? 'Não consegui pegar a imagem.');
      } else {
        setImageUrl(json.image_url);
        setFetchError(null);
        // Pré-preenche título se o campo estiver vazio
        if (json.title && !title.trim()) setTitle(json.title);
        // Pré-preenche valor se o campo estiver vazio
        if (json.price && !quotaValue) setQuotaValue(String(json.price));
      }
    } catch {
      setFetchError('Erro ao buscar a imagem.');
    } finally {
      setFetchBusy(false);
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(quotaValue);
    if (!title.trim() || isNaN(val) || val <= 0) return;
    onAdd({
      title: title.trim(),
      description: description.trim(),
      kind,
      quota_value: val,
      quota_total: isBuffet ? 999999 : Math.max(1, parseInt(quotaTotal, 10) || 1),
      image_url: imageUrl.trim()
    });
    setTitle(''); setDescription(''); setQuotaValue(''); setQuotaTotal('10');
    setKind('gift'); setImageUrl(''); setFetchError(null); setOpen(false);
  }

  return (
    <div className="space-y-3">
      {gifts.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {gifts.map((g) => (
            <li key={g.id} className="flex items-center gap-3 py-2.5">
              {g.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={g.image_url}
                  alt={g.title}
                  className="h-12 w-12 shrink-0 rounded-md border border-gray-200 object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-gray-100 bg-gray-50 text-2xl">
                  {g.kind === 'buffet' ? '🍽️' : '🎁'}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-gray-900">{g.title}</div>
                {g.description && <div className="truncate text-xs text-gray-500">{g.description}</div>}
                <div className="text-xs text-gray-500">
                  {g.kind === 'buffet'
                    ? `R$ ${g.quota_value.toFixed(2).replace('.', ',')} por pessoa`
                    : `R$ ${g.quota_value.toFixed(2).replace('.', ',')} × ${g.quota_total} cota(s)`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(g.id)}
                className="shrink-0 rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:border-red-300 hover:text-red-600"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <form onSubmit={handleAdd} className="space-y-3 rounded-md border border-dashed border-gray-300 p-4">
          <div className="text-sm font-medium">Adicionar item</div>

          {planTier === 'themed' && (
            <div className="grid grid-cols-2 gap-2">
              {(['gift', 'buffet'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`flex items-center gap-2 rounded-md border-2 px-3 py-2 text-left text-sm ${
                    kind === k ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{k === 'buffet' ? '🍽️' : '🎁'}</span>
                  <div>
                    <div className="font-medium leading-tight">{k === 'buffet' ? 'Buffet / Contribuição' : 'Presente'}</div>
                    <div className="text-[10px] leading-tight text-gray-500">
                      {k === 'buffet' ? 'Valor por pessoa' : 'Convidados dividem em cotas'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isBuffet ? 'Ex.: Buffet adulto' : 'Ex.: Triciclo — cotas de R$ 50'}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição opcional"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />

          {/* Foto / URL com busca de thumbnail */}
          <div>
            <div className="text-xs text-gray-600">
              {isBuffet
                ? 'Foto (opcional): cole um link de imagem.'
                : 'Foto: cole o link do produto e clique em 🔍 Buscar, ou cole direto a URL da imagem.'}
            </div>
            <div className="mt-1.5 flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); setFetchError(null); }}
                placeholder={isBuffet ? 'URL da foto (opcional)' : 'Link da loja ou da imagem'}
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {!isBuffet && (
                <button
                  type="button"
                  onClick={handleFetchImage}
                  disabled={fetchBusy || !imageUrl.trim()}
                  className="shrink-0 rounded-md border border-brand-300 bg-white px-3 py-2 text-sm text-brand-700 hover:bg-brand-50 disabled:opacity-60"
                >
                  {fetchBusy ? 'Buscando...' : '🔍 Buscar'}
                </button>
              )}
            </div>
            {fetchError && (
              <div className="mt-1 space-y-1.5">
                <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{fetchError}</div>
                {/mercadolivre|mercadolibre|meli\.la/i.test(imageUrl) ? (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
                    💡 <strong>Dica Mercado Livre:</strong> em vez de copiar o link da barra de endereço, clique no botão <strong>Compartilhar</strong> no produto — o link gerado (meli.la/…) funciona muito melhor com a busca de imagens.
                  </div>
                ) : (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-800">
                    💡 Algumas lojas bloqueiam a busca automática. Tente usar o botão <strong>Compartilhar</strong> da página do produto — o link gerado costuma funcionar melhor.
                  </div>
                )}
              </div>
            )}
            {imageUrl && (
              <div className="mt-2 flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-2">
                <div className="shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Pré-visualização"
                    className="h-20 w-20 object-contain"
                    onError={() => setFetchError('Imagem não carregou. Tente outro link.')}
                  />
                </div>
                <div className="min-w-0 flex-1 text-xs text-green-800">
                  <div className="font-semibold">✓ Imagem capturada</div>
                  {(title || quotaValue) && (
                    <div className="mt-1 space-y-0.5 text-green-700">
                      {title && <div>🏷️ Título: <span className="font-medium">{title}</span></div>}
                      {quotaValue && <div>💰 Valor: <span className="font-medium">R$ {quotaValue}</span></div>}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setImageUrl(''); setFetchError(null); }}
                    className="mt-1.5 text-red-500 hover:underline"
                  >
                    Remover imagem
                  </button>
                </div>
              </div>
            )}
          </div>

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
            <button type="submit" className="rounded-md bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600">
              Adicionar
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600"
        >
          + Adicionar item
        </button>
      )}
    </div>
  );
}

function SuggestionsSection({
  suggestions,
  onAdd,
  onRemove
}: {
  suggestions: DraftSuggestion[];
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState('');

  function handleAdd() {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft('');
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {suggestions.length === 0 && (
          <span className="text-xs text-gray-500">
            Nenhuma sugestão ainda. Adicione abaixo, ex.: <code>👕 Roupa: Tam 3</code>.
          </span>
        )}
        {suggestions.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-gray-800 ring-1 ring-black/5 shadow-sm"
            style={{ background: s.color ?? '#f3f4f6' }}
          >
            {s.emoji && <span>{s.emoji}</span>}
            <span>{s.label}</span>
            <button
              type="button"
              onClick={() => onRemove(s.id)}
              className="-mr-1 ml-1 rounded-full px-1 text-xs text-gray-500 hover:bg-black/10 hover:text-gray-700"
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
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder="Ex.: 👕 Roupa: Tam 3, 👟 Calçado: Tam 23, 🎨 Material de pintura"
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="shrink-0 rounded-md bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          Adicionar
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Comece com um emoji se quiser destacar (ele aparece na bolinha colorida).
      </p>
    </div>
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
        selected ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-200' : 'border-gray-200 bg-white hover:border-gray-300'
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
