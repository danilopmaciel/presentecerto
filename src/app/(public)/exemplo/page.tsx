import Link from 'next/link';
import { DemoEventPreview } from './DemoEventPreview';

export const dynamic = 'force-static';

const DEMO_EVENT = {
  title: 'Aniversário da Sofia — 5 anos 🎉',
  description:
    'Página de demonstração do PresenteCerto. Crie a sua igualzinha em minutos: monta a lista de presentes em cotas de Pix, escolhe um dos 12 temas ou personaliza com sua foto, e compartilha um link bonito no grupo do WhatsApp.',
  starts_at_label: 'Sábado, 14:00 — data e local ilustrativos',
  location_text: 'Buffet exemplo · cidade exemplo'
};

// SVGs inline em data: URI — não dependem de CDN externa, sempre renderizam.
function svgGift(label: string, bgFrom: string, bgTo: string, emoji: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${bgFrom}'/>
        <stop offset='1' stop-color='${bgTo}'/>
      </linearGradient>
    </defs>
    <rect width='200' height='200' fill='url(#g)'/>
    <text x='100' y='110' text-anchor='middle' font-size='80' dominant-baseline='middle'>${emoji}</text>
    <text x='100' y='170' text-anchor='middle' font-size='14' font-family='system-ui, -apple-system, sans-serif' font-weight='600' fill='#1f2937'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const DEMO_GIFTS = [
  {
    id: 'g1',
    title: 'Triciclo elétrico',
    description: 'Cotas pra completar o presentão',
    image_path: svgGift('Triciclo', '#fde68a', '#fb923c', '🛺'),
    quota_value_cents: 5000,
    quota_total: 12,
    reserved: 8
  },
  {
    id: 'g2',
    title: 'Pista de carrinhos com loop',
    description: 'A pista com 4 carrinhos',
    image_path: svgGift('Pista', '#bfdbfe', '#3b82f6', '🏎️'),
    quota_value_cents: 3000,
    quota_total: 6,
    reserved: 6
  },
  {
    id: 'g3',
    title: 'Caixa de blocos de montar',
    description: 'Estimula motricidade fina',
    image_path: svgGift('Blocos', '#bbf7d0', '#16a34a', '🧱'),
    quota_value_cents: 4000,
    quota_total: 5,
    reserved: 2
  },
  {
    id: 'g4',
    title: 'Livro de aventuras',
    description: 'Coleção pra dormir',
    image_path: svgGift('Livros', '#ddd6fe', '#7c3aed', '📚'),
    quota_value_cents: 2500,
    quota_total: 4,
    reserved: 0
  }
];

const DEMO_SUGGESTIONS = [
  { emoji: '👕', label: 'Roupa: Tam 3', color: '#fee2e2' },
  { emoji: '👟', label: 'Calçado: Tam 23', color: '#ffedd5' },
  { emoji: '🎨', label: 'Material de pintura', color: '#fef9c3' },
  { emoji: '🎲', label: 'Jogo educativo 3+', color: '#dcfce7' },
  { emoji: '📚', label: 'Livro infantil', color: '#cffafe' }
];

export default function ExamplePage() {
  return (
    <main className="min-h-dvh bg-white">
      {/* CTA bar fixa no topo */}
      <div className="sticky top-0 z-40 border-b border-brand-200 bg-brand-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Demo
            </span>
            <span className="hidden sm:inline text-brand-900">
              Pré-visualização interativa — clique nos temas e botões pra explorar.
            </span>
            <span className="sm:hidden text-brand-900">Pré-visualização.</span>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href="/login?create=1"
              className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-brand-600"
            >
              Criar o meu →
            </Link>
          </div>
        </div>
      </div>

      {/* Antes vs depois — pain → solução */}
      <section className="border-b border-gray-200 bg-gray-50 py-12">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Adeus planilha no grupo
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Comparativo lado a lado de como organizar um aniversário hoje × com PresenteCerto.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {/* Antes */}
            <div className="rounded-2xl border border-red-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">😩</span>
                <h3 className="text-lg font-semibold text-red-700">Sem PresenteCerto</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <PainItem>
                  Mensagem grande no grupo do WhatsApp explicando data, local, lista, Pix...
                </PainItem>
                <PainItem>
                  Planilha caseira no Google Sheets pra controlar quem vai e quem comprou o quê
                </PainItem>
                <PainItem>
                  Convidado fica em dúvida se outro já levou o triciclo — você responde 1 a 1
                </PainItem>
                <PainItem>
                  Você bate olho no extrato do banco pra cruzar Pix com nome no WhatsApp
                </PainItem>
                <PainItem>Erros: presente repetido, RSVP perdido, ninguém entende o link</PainItem>
              </ul>
            </div>

            {/* Depois */}
            <div className="relative rounded-2xl border-2 border-brand-500 bg-gradient-to-b from-brand-50 to-white p-6 shadow-md">
              <div className="absolute -top-3 right-6 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                Em 5 minutos
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <h3 className="text-lg font-semibold text-brand-700">Com PresenteCerto</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <WinItem>
                  <strong>Um link bonito</strong> pra mandar no grupo — com tema personalizado
                </WinItem>
                <WinItem>
                  <strong>Lista de presentes em cotas</strong> — convidados só veem o que ainda
                  está disponível
                </WinItem>
                <WinItem>
                  <strong>Pix direto na sua chave</strong> — sem taxa, sem intermediário
                </WinItem>
                <WinItem>
                  <strong>Painel em tempo real</strong> com confirmados, cotas vendidas, total
                  arrecadado
                </WinItem>
                <WinItem>
                  <strong>Sem mensalidade</strong> — paga só uma vez por evento, R$ 20 ou R$ 50
                </WinItem>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bloco interativo — preview do evento com troca de tema ao vivo */}
      <DemoEventPreview
        event={DEMO_EVENT}
        gifts={DEMO_GIFTS}
        suggestions={DEMO_SUGGESTIONS}
        initialThemeId="carros-pista"
      />

      {/* Footer pós-preview */}
      <section className="border-t border-gray-100 bg-white py-10 text-center">
        <p className="text-sm text-gray-600">
          Curtiu? <strong>Você monta o seu de graça</strong> — só paga quando quiser publicar.
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login?create=1&plan=basic"
            className="rounded-md border border-brand-300 bg-white px-5 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            Criar Básico — R$ 20
          </Link>
          <Link
            href="/login?create=1&plan=themed"
            className="rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-brand-600"
          >
            Criar Temático — R$ 50
          </Link>
        </div>
      </section>

      {/* Bloco mockup do painel do anfitrião */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-800">
              Por trás
            </span>
            <h2 className="mt-3 text-3xl font-bold">
              Assim você <span className="text-brand-600">monta</span> a sua
            </h2>
            <p className="mt-2 text-gray-600">
              No painel do anfitrião você controla tudo em tempo real, sem complicação.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <MockCard
              title="Adicionar presentes"
              icon="🎁"
              body="Cole o link da loja (Mercado Livre, Amazon...) e a foto vem automaticamente. Define o valor da cota e quantas cotas o presente terá."
              previewBg="from-brand-50 to-white"
            >
              <div className="rounded-md border border-dashed border-brand-300 bg-white p-3">
                <div className="text-xs font-semibold text-brand-700">Adicionar presente</div>
                <div className="mt-2 space-y-2">
                  <div className="rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-500">
                    Triciclo elétrico
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-500">
                      mercadolivre.com.br/triciclo-eletric...
                    </div>
                    <div className="rounded bg-brand-500 px-2 py-1.5 text-[10px] font-medium text-white">
                      🔍 Buscar
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-500">
                      R$ 50
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-500">
                      12 cotas
                    </div>
                  </div>
                </div>
              </div>
            </MockCard>

            <MockCard
              title="Escolher tema"
              icon="🎨"
              body="12 temas com hero art ilustrado — princesa, super-herói, espaço, dinos, carros, mar, frozen e mais. Aplica em tempo real, sem reload."
              previewBg="from-purple-50 to-white"
            >
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { bg: 'from-pink-200 to-rose-100', label: 'Princesa' },
                  { bg: 'from-blue-200 to-cyan-100', label: 'Frozen' },
                  { bg: 'from-yellow-200 to-orange-100', label: 'Carros', selected: true },
                  { bg: 'from-green-200 to-emerald-100', label: 'Dinos' },
                  { bg: 'from-purple-200 to-fuchsia-100', label: 'Espaço' },
                  { bg: 'from-amber-200 to-orange-200', label: 'Pirata' }
                ].map((t, i) => (
                  <div
                    key={i}
                    className={`overflow-hidden rounded border-2 ${
                      t.selected ? 'border-brand-500 ring-2 ring-brand-200' : 'border-gray-200'
                    }`}
                  >
                    <div className={`h-10 bg-gradient-to-br ${t.bg}`} />
                    <div className="bg-white px-1 py-0.5 text-[9px] font-medium">
                      {t.label}
                      {t.selected && ' ✓'}
                    </div>
                  </div>
                ))}
              </div>
            </MockCard>

            <MockCard
              title="Acompanhar pagamentos"
              icon="📊"
              body="Convidado clica 'Já paguei' depois de mandar o Pix. Você confirma quando ver na sua conta. Painel com stats em tempo real."
              previewBg="from-green-50 to-white"
            >
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded border border-gray-200 bg-white p-2">
                    <div className="text-[9px] uppercase text-gray-500">Confirmados</div>
                    <div className="text-base font-bold">23</div>
                  </div>
                  <div className="rounded border border-gray-200 bg-white p-2">
                    <div className="text-[9px] uppercase text-gray-500">Cotas pagas</div>
                    <div className="text-base font-bold">31</div>
                  </div>
                  <div className="rounded border border-gray-200 bg-white p-2">
                    <div className="text-[9px] uppercase text-gray-500">Total</div>
                    <div className="text-base font-bold text-green-700">R$ 1.450</div>
                  </div>
                </div>
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-amber-900">Joana M. · 2 cotas</span>
                    <div className="flex gap-1">
                      <span className="rounded bg-green-600 px-2 py-0.5 text-[9px] font-bold text-white">
                        ✓
                      </span>
                      <span className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[9px]">
                        Não recebi
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </MockCard>

            <MockCard
              title="Compartilhar e divulgar"
              icon="🔗"
              body="Um link público bonito tipo presentecerto.app/e/aniv-sofia-5. Manda no grupo do WhatsApp e pronto."
              previewBg="from-amber-50 to-white"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white p-2">
                  <div className="flex-1 truncate font-mono text-[11px] text-gray-600">
                    presentecerto.app/e/aniv-sofia-5
                  </div>
                  <span className="rounded bg-brand-500 px-2 py-1 text-[10px] font-medium text-white">
                    Copiar
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-2 text-[11px] text-green-800">
                  <span>✓</span>
                  <span>Publicado — convidados podem acessar</span>
                </div>
              </div>
            </MockCard>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/login?create=1"
              className="inline-block rounded-md bg-brand-500 px-6 py-3 font-medium text-white shadow hover:bg-brand-600"
            >
              Criar meu evento agora →
            </Link>
            <p className="mt-2 text-xs text-gray-500">
              Sem cartão. Você só paga R$ 20 (Básico) ou R$ 50 (Temático) quando decidir publicar.
            </p>
          </div>
        </div>
      </section>

      {/* Footer com CTA final */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold">Pronto pra montar o seu?</h2>
          <p className="mt-2 text-gray-600">
            Toda a montagem é grátis — você experimenta tudo, vê como ficou e só paga se quiser
            publicar pros convidados.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login?create=1&plan=basic"
              className="rounded-md border border-brand-300 bg-white px-6 py-3 font-medium text-brand-700 hover:bg-brand-50"
            >
              Criar Básico — R$ 20
            </Link>
            <Link
              href="/login?create=1&plan=themed"
              className="rounded-md bg-brand-500 px-6 py-3 font-medium text-white shadow hover:bg-brand-600"
            >
              Criar Temático — R$ 50
            </Link>
          </div>
          <div className="mt-4">
            <Link href="/" className="text-xs text-gray-500 hover:underline">
              ← Voltar pra página inicial
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function PainItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
        ✕
      </span>
      <span>{children}</span>
    </li>
  );
}

function WinItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

function MockCard({
  title,
  icon,
  body,
  previewBg,
  children
}: {
  title: string;
  icon: string;
  body: string;
  previewBg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className={`bg-gradient-to-b ${previewBg} p-5`}>
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          {children}
        </div>
      </div>
      <div className="p-5">
        <div className="text-2xl">{icon}</div>
        <h3 className="mt-1 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{body}</p>
      </div>
    </div>
  );
}
