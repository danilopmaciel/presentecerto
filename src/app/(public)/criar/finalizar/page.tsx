'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { finalizeDraft } from '../actions';

const DRAFT_KEY = 'pc_draft_v1';

type Stage =
  | 'loading'
  | 'no-draft'
  | 'need-profile'
  | 'submitting'
  | 'error'
  | 'done';

type Draft = {
  title?: string;
  description?: string;
  starts_at?: string;
  location_text?: string;
  location_maps_url?: string;
  plan_tier?: 'basic' | 'themed';
  pix_key?: string;
};

export default function FinalizarPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('loading');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [profileFullName, setProfileFullName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  // 1. Confere sessão. Se não tem, manda pro login com return aqui.
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?next=/criar/finalizar');
        return;
      }

      // 2. Lê rascunho do localStorage
      let parsed: Draft | null = null;
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) parsed = JSON.parse(raw) as Draft;
      } catch {
        parsed = null;
      }
      if (!parsed || !parsed.title) {
        setStage('no-draft');
        return;
      }
      setDraft(parsed);

      // 3. Lê profile pra ver se faltam nome/telefone
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      const hasName = !!profile?.full_name?.trim();
      const hasPhone = !!profile?.phone?.trim();
      setProfileFullName(profile?.full_name ?? '');
      setProfilePhone(profile?.phone ?? '');

      if (!hasName || !hasPhone) {
        setStage('need-profile');
      } else {
        // Já tem cadastro completo — submete direto
        await submit(parsed, profile?.full_name ?? '', profile?.phone ?? '');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(d: Draft, fullName: string, phone: string) {
    setStage('submitting');
    setErrMsg(null);
    const res = await finalizeDraft({
      ...d,
      full_name: fullName,
      phone
    });
    if ('error' in res) {
      setErrMsg(res.error ?? 'Erro desconhecido ao criar evento.');
      setStage('error');
      return;
    }
    // Sucesso — limpa rascunho e vai pro painel do evento
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setStage('done');
    router.replace(`/app/eventos/${res.event_id}`);
  }

  if (stage === 'loading') {
    return (
      <Centered>
        <div className="text-sm text-gray-600">Carregando rascunho...</div>
      </Centered>
    );
  }

  if (stage === 'no-draft') {
    return (
      <Centered>
        <div className="text-center">
          <h1 className="text-xl font-bold">Nenhum rascunho encontrado</h1>
          <p className="mt-2 text-sm text-gray-600">
            Parece que o rascunho foi limpo ou você entrou aqui sem ter começado um evento.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/criar"
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Começar um evento
            </Link>
            <Link
              href="/app"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Ir pro meu painel
            </Link>
          </div>
        </div>
      </Centered>
    );
  }

  if (stage === 'need-profile') {
    return (
      <Centered>
        <h1 className="text-2xl font-bold">Última etapa: seu cadastro</h1>
        <p className="mt-1 text-sm text-gray-600">
          Só pra completar — depois disso o evento <strong>{draft?.title}</strong> é criado e
          você vai direto pro painel pra adicionar presentes.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft) return;
            if (!profileFullName.trim() || profileFullName.trim().length < 2) {
              setErrMsg('Informe seu nome completo.');
              return;
            }
            if (!profilePhone.trim() || profilePhone.replace(/\D/g, '').length < 10) {
              setErrMsg('Informe um telefone válido com DDD.');
              return;
            }
            setErrMsg(null);
            submit(draft, profileFullName.trim(), profilePhone.trim());
          }}
          className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Nome completo
              <span className="ml-0.5 text-red-500">*</span>
            </span>
            <input
              required
              value={profileFullName}
              onChange={(e) => setProfileFullName(e.target.value)}
              placeholder="Como você se apresenta"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Telefone (WhatsApp)
              <span className="ml-0.5 text-red-500">*</span>
            </span>
            <input
              required
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            <span className="mt-1 block text-[11px] text-gray-500">
              Usado só pra suporte e notificação de pagamento. Não compartilhamos com ninguém.
            </span>
          </label>

          {errMsg && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {errMsg}
            </div>
          )}

          <button
            type="submit"
            className="block w-full rounded-md bg-brand-500 px-6 py-3 text-center font-semibold text-white shadow hover:bg-brand-600"
          >
            Criar meu evento →
          </button>
        </form>

        <details className="mt-4 text-xs text-gray-500">
          <summary className="cursor-pointer">O que vai ser criado</summary>
          <ul className="mt-2 space-y-1 pl-5 [&>li]:list-disc">
            <li>Evento "{draft?.title}" (rascunho — ainda não publicado)</li>
            <li>Plano: {draft?.plan_tier === 'themed' ? 'Temático (R$ 50)' : 'Básico (R$ 20)'}</li>
            <li>Sua chave Pix de recebimento</li>
            <li>Nada é cobrado agora — só na hora de publicar</li>
          </ul>
        </details>
      </Centered>
    );
  }

  if (stage === 'submitting') {
    return (
      <Centered>
        <div className="text-center">
          <div className="text-4xl">✨</div>
          <div className="mt-3 text-sm font-medium text-gray-700">Criando seu evento...</div>
        </div>
      </Centered>
    );
  }

  if (stage === 'error') {
    return (
      <Centered>
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-700">Falha ao criar evento</h1>
          <p className="mt-2 text-sm text-gray-600">{errMsg}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/criar"
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Voltar pro rascunho
            </Link>
          </div>
        </div>
      </Centered>
    );
  }

  // done — está redirecionando
  return (
    <Centered>
      <div className="text-sm text-gray-600">Tudo pronto, redirecionando...</div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-lg flex-col justify-center px-4 py-10 sm:px-6">
      {children}
    </main>
  );
}
