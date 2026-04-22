import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="text-xl font-bold text-brand-700">PresenteCerto</div>
        <nav className="flex gap-3 text-sm">
          <Link href="/login" className="rounded-md px-3 py-2 hover:bg-brand-100">
            Entrar
          </Link>
          <Link
            href="/login?create=1"
            className="rounded-md bg-brand-500 px-3 py-2 text-white hover:bg-brand-600"
          >
            Criar meu evento
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          Seu aniversário, <span className="text-brand-600">sem planilha no grupo do WhatsApp</span>.
        </h1>
        <p className="mt-6 text-lg text-gray-700">
          Crie uma página bonita do seu evento, divida presentes em cotas de Pix e receba
          confirmações de presença. Do convite ao agradecimento, tudo em um link.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login?create=1"
            className="rounded-md bg-brand-500 px-6 py-3 text-white shadow hover:bg-brand-600"
          >
            Criar meu evento — R$ 20
          </Link>
          <Link
            href="/login?create=1&plan=themed"
            className="rounded-md border border-brand-300 bg-white px-6 py-3 text-brand-700 hover:bg-brand-50"
          >
            Plano temático + notificações — R$ 50
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
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
