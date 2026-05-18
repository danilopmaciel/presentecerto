import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-dvh bg-gradient-to-b from-brand-50 to-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="text-xl font-bold text-brand-700">PresenteCerto</div>
        <nav className="flex gap-3 text-sm">
          {user ? (
            <Link href="/app" className="rounded-md bg-brand-100 px-3 py-2 font-medium text-brand-700 hover:bg-brand-200">
              Meu Painel
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-2 hover:bg-brand-100">
                Entrar
              </Link>
              <Link
                href="/login?create=1"
                className="rounded-md bg-brand-500 px-3 py-2 text-white hover:bg-brand-600"
              >
                Criar meu evento
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 md:py-16">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
          Seu aniversário,{' '}
          <span className="text-brand-600">sem planilha no grupo do WhatsApp</span>.
        </h1>
        <p className="mt-6 text-lg text-gray-700">
          Crie uma página bonita do seu evento, divida presentes em cotas de Pix e receba
          confirmações de presença. Do convite ao agradecimento, tudo em um link.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/e/teste-mdjz"
            className="rounded-md bg-brand-500 px-6 py-3 text-white shadow hover:bg-brand-600"
          >
            Ver exemplo de evento
          </Link>
          <Link
            href="#planos"
            className="rounded-md border border-brand-300 bg-white px-6 py-3 text-brand-700 hover:bg-brand-50"
          >
            Comparar planos
          </Link>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Você monta o evento todo grátis. Só paga quando quiser publicar pros convidados.
        </p>
      </section>

      {/* Comparativo de planos */}
      <section id="planos" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h2 className="text-center text-3xl font-bold">Escolha seu plano</h2>
        <p className="mt-2 text-center text-gray-600">
          Pagamento único — sem mensalidade, sem taxa sobre o Pix dos presentes.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Básico */}
          <div className="flex flex-col rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">
              Básico
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold">R$ 20</span>
              <span className="text-sm text-gray-500">/ evento</span>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Tudo que você precisa pra organizar um aniversário enxuto e cobrar os presentes via
              Pix.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <Feature>Página do evento com data, local e descrição</Feature>
              <Feature>Lista de presentes em cotas de Pix</Feature>
              <Feature>QR Code + Pix copia-e-cola direto pra sua chave</Feature>
              <Feature>Confirmação de presença (RSVP) dos convidados</Feature>
              <Feature>Painel do anfitrião com stats em tempo real</Feature>
              <Feature>Sugestões de presente em texto livre (sem cotas)</Feature>
              <Feature>Pré-visualização privada antes de publicar</Feature>
              <Feature>
                <span className="text-gray-400">Tema visual padrão (sem decoração)</span>
              </Feature>
            </ul>

            <div className="mt-8">
              <Link
                href="/login?create=1&plan=basic"
                className="block rounded-md border border-brand-300 bg-white px-6 py-3 text-center font-medium text-brand-700 hover:bg-brand-50"
              >
                Criar evento Básico
              </Link>
            </div>
          </div>

          {/* Temático */}
          <div className="relative flex flex-col rounded-2xl border-2 border-brand-500 bg-gradient-to-b from-brand-50 to-white p-8 shadow-md">
            <div className="absolute -top-3 right-6 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
              Mais escolhido
            </div>
            <div className="mb-2 text-sm font-medium uppercase tracking-wide text-brand-700">
              Temático
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold">R$ 50</span>
              <span className="text-sm text-gray-500">/ evento</span>
            </div>
            <p className="mt-3 text-sm text-gray-700">
              Tudo do Básico, com tema visual completo pra sua festa parecer feita por um
              designer.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <Feature>
                <strong>Tudo do plano Básico</strong>
              </Feature>
              <Feature>
                <strong>12 temas prontos</strong> — princesa, super-herói, espaço, dinos,
                unicórnio, pirata, carros, safari, mar, frozen, infantil rosa/azul
              </Feature>
              <Feature>Hero art (cena ilustrada) no topo da página do evento</Feature>
              <Feature>Padrões e decorações de fundo combinando com o tema</Feature>
              <Feature>
                Cards dos presentes com cor de destaque e tipografia personalizada
              </Feature>
              <Feature>
                Trocar o tema a qualquer momento — aplica em tempo real no link do evento
              </Feature>
              <Feature>
                <span className="text-gray-500">
                  Em breve: convites e lembretes automáticos por WhatsApp/e-mail
                </span>
              </Feature>
            </ul>

            <div className="mt-8">
              <Link
                href="/login?create=1&plan=themed"
                className="block rounded-md bg-brand-500 px-6 py-3 text-center font-medium text-white shadow hover:bg-brand-600"
              >
                Criar evento Temático
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Comece pelo Básico e mude pra Temático depois sem perder o que já configurou. Pagamento
          único via Pix — sem mensalidade.
        </p>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <h2 className="text-center text-2xl font-bold">Como funciona</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card
            title="1. Crie seu evento"
            body="Nome, data, local, foto. Monte sua lista de presentes em cotas — cada presente pode ter várias cotas de R$ 20, R$ 50 ou o valor que você quiser."
          />
          <Card
            title="2. Compartilhe o link"
            body="Seus convidados abrem a página, confirmam presença e escolhem presentear com Pix. Pagamento vai direto na sua chave."
          />
          <Card
            title="3. Acompanhe tudo"
            body="Painel com lista de confirmados, cotas vendidas e total arrecadado. Sem taxa sobre o Pix — você só paga pela criação do evento."
          />
        </div>
      </section>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="text-lg font-semibold text-brand-700">{title}</div>
      <p className="mt-2 text-sm text-gray-600">{body}</p>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
        ✓
      </span>
      <span className="text-gray-700">{children}</span>
    </li>
  );
}
