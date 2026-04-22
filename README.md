# PresenteCerto

SaaS de lista de presentes em cotas + RSVP com Pix. Fase 1 — Pix estático (sem custódia), zero custo de infraestrutura (Vercel + Supabase free tier).

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres, Auth, Storage, RLS)
- Tailwind CSS
- Zod para validação
- Deploy: Vercel

## Estrutura do projeto

```
presentecerto/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx           # login magic link
│   │   │   └── auth/callback/route.ts   # callback do Supabase Auth
│   │   ├── (host)/
│   │   │   └── app/
│   │   │       ├── layout.tsx           # auth guard
│   │   │       ├── page.tsx             # lista de eventos
│   │   │       └── eventos/
│   │   │           ├── novo/page.tsx    # criar evento
│   │   │           └── [id]/page.tsx    # detalhe + pagamento plano + publicar
│   │   ├── (public)/
│   │   │   └── e/[slug]/                # página pública (RSVP + comprar cota)
│   │   ├── api/
│   │   │   └── purchases/               # reservar cota + gerar Pix
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # landing
│   │   └── globals.css
│   ├── lib/
│   │   ├── supabase/                    # clients server/browser/middleware
│   │   ├── payments/                    # PaymentProvider + StaticPix + EMV
│   │   ├── validation/schemas.ts        # zod
│   │   └── utils.ts
│   └── middleware.ts                    # refresh de sessão na edge
├── supabase/
│   └── migrations/
│       └── 20260417000000_initial.sql   # schema + RLS + RPC purchase_quota
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Setup local (10 minutos)

**1. Instalar dependências**

```bash
npm install
```

**2. Criar projeto no Supabase**

Entre em https://app.supabase.com → **New project** → região **São Paulo (sa-east-1)** → anote a senha do banco. Plano Free é suficiente.

No projeto criado, abra **SQL Editor** → cole o conteúdo de `supabase/migrations/20260417000000_initial.sql` → **Run**. Isso cria todas as tabelas, RLS e a função `purchase_quota`.

**3. Configurar variáveis de ambiente**

```bash
cp .env.example .env.local
```

Preencha:

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`: em Supabase → **Project Settings → API**.
- `SUPABASE_SERVICE_ROLE_KEY`: mesma tela, botão "Reveal". **Nunca comite nem exponha no cliente.**
- `NEXT_PUBLIC_SITE_URL`: `http://localhost:3000` em dev, URL da Vercel em produção.
- `SAAS_PIX_KEY`: sua chave Pix (do CNPJ MEI) para receber os R$ 20 / R$ 50 dos planos.
- `SAAS_PIX_MERCHANT_NAME`: nome que aparece no Pix (máx 25 chars, sem acento).
- `SAAS_PIX_MERCHANT_CITY`: cidade (máx 15 chars, sem acento).

**4. Rodar**

```bash
npm run dev
```

Abra http://localhost:3000. Crie sua conta (magic link) e teste o fluxo completo.

## Deploy (GitHub → Vercel)

**1. Subir no GitHub**

```bash
cd presentecerto
git init
git add .
git commit -m "feat: MVP fase 1 — Pix estatico, RSVP, lista de cotas"
gh repo create presentecerto --private --source . --remote origin --push
# ou, sem gh CLI: crie o repo pelo site e rode `git remote add origin ... && git push -u origin main`
```

**2. Importar na Vercel**

1. https://vercel.com/new → escolha o repo `presentecerto`.
2. **Framework Preset**: Next.js (detecta automático).
3. **Environment Variables**: cole todas do `.env.local` (troque `NEXT_PUBLIC_SITE_URL` pela URL da Vercel — ex: `https://presentecerto.vercel.app`).
4. Deploy.

**3. Configurar Supabase Auth para aceitar a URL da Vercel**

Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://presentecerto.vercel.app` (ou seu domínio)
- **Redirect URLs**: adicione `https://presentecerto.vercel.app/auth/callback`

Depois disso, magic link de produção funciona.

## Fluxo Fase 1 (como funciona)

### Para o anfitrião

1. Loga com e-mail (magic link).
2. Cria evento (título, data, local, chave Pix pessoal, escolhe plano Básico R$ 20 ou Temático R$ 50).
3. Evento vai para `status = 'draft'`, `plan_payment_status = 'pending'`.
4. Anfitrião adiciona presentes em cotas.
5. Clica "Gerar Pix do plano" → aparece copia-e-cola apontando para a **sua chave Pix** (do SaaS).
6. Anfitrião paga. Clica "Já paguei".
7. **Você** (operador) confere o extrato do seu Pix e, ao encontrar o txid, muda `plan_payment_status` para `paid` (por enquanto manual — SQL abaixo).
8. Anfitrião publica o evento → `status = 'published'`, página pública fica ativa em `/e/{slug}`.

### Para o convidado (página pública)

1. Abre `/e/{slug}`.
2. Confirma presença (RSVP).
3. Escolhe um presente e quantidade de cotas.
4. Sistema reserva (transação atômica via RPC `purchase_quota`) e gera Pix copia-e-cola para a **chave do anfitrião**.
5. Convidado paga no banco e clica "Já paguei" → marca `status = 'paid_claimed'`.
6. Anfitrião confirma no painel → `status = 'paid'`.

### Confirmação manual do pagamento do plano (por enquanto)

Enquanto não integra um PSP com webhook, você confirma na mão. SQL no Supabase Studio:

```sql
-- lista pagamentos de plano aguardando confirmação
select id, title, plan_tier, plan_fee_cents, plan_pix_txid, plan_payment_status
from events
where plan_payment_status = 'paid_claimed';

-- depois de bater o txid com o extrato do seu Pix, marque como pago
update events set plan_payment_status = 'paid', plan_paid_at = now()
where id = '<uuid-do-evento>';
```

Quando o volume justificar (~10 eventos/mês), migre para PSP com webhook (Fase 2).

## Custos esperados (Fase 1)

| Serviço | Plano | Custo |
|---------|-------|-------|
| Vercel | Hobby | R$ 0 |
| Supabase | Free | R$ 0 |
| Domínio | — | ~R$ 40/ano (opcional; `.vercel.app` funciona) |
| E-mail transacional (Resend) | Free | R$ 0 até 3000/mês |

**Total: R$ 0 até validar.**

## Próximos passos (pós-validação)

- Migrar PaymentProvider para Asaas ou Pagar.me (split Pix + webhook).
- Adicionar upload de foto de capa (Supabase Storage já configurado no migration).
- Convites por WhatsApp (Meta Cloud API) + e-mail (Resend) — plano Temático.
- Lembretes automáticos via `pg_cron`.
- OG image dinâmica para viralizar no WhatsApp.
- Fiscal: emissão de NFS-e (Nota Azul/Enotas) da taxa.

## MEI — atividade recomendada

O CNAE ideal para SaaS (`6202-3/00` — licenciamento de software customizável) historicamente **não é permitido no MEI**. Antes de adicionar atividade:

1. Verifique a lista vigente no Portal do Empreendedor: https://www.gov.br/empresas-e-negocios/pt-br/empreendedor
2. Se 6202/6203 não estiverem disponíveis, adicione uma atividade MEI compatível apenas para Fase 1 (ex.: atividades auxiliares de informática, se permitidas no ano corrente).
3. Lembre que **MEI tem teto de R$ 81.000/ano**. Plano de R$ 10k/mês estoura o limite — planeje migração para ME (Simples Nacional) antes da Fase 2 (split com PSP exige CNAE compatível).

## Licença

Código privado. Propriedade do autor.
