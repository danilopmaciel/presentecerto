/**
 * Contrato de provedor de pagamento.
 * Fase 1: StaticPixProvider (chave do anfitrião, sem custódia).
 * Fase 2: SplitPixProvider via PSP (Asaas/Pagar.me) — plug-in sem mexer no resto.
 */

export type CreateChargeInput = {
  /** valor total em centavos */
  amountCents: number;
  /** id local que viaja no txid (gift_purchases.id ou events.id pro plano) */
  externalReference: string;
  buyer: { name: string; email?: string | null; phone?: string | null };
  /** Fase 2: split por conta do PSP */
  split?: Array<{ accountId: string; amountCents: number }>;
  expiresInSeconds?: number;
  description?: string;
  /** overrides por-cobrança (Fase 1 precisa saber a chave do anfitrião do evento) */
  receiver?: {
    pixKey: string;
    merchantName: string;
    merchantCity: string;
  };
};

export type CreateChargeResult = {
  providerExternalId: string | null;
  pixPayload: string;
  pixTxid: string;
  expiresAt: Date;
};

export type WebhookPayment = {
  externalReference: string;
  status: 'paid' | 'expired' | 'refunded';
  paidAt?: Date;
  providerExternalId?: string;
};

export interface PaymentProvider {
  readonly name: string;
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
  /** Retorna false quando não há assinatura a validar (Fase 1 estático). */
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean;
  parseWebhook(payload: unknown): WebhookPayment;
}

/* ----- factory ----- */

import { StaticPixProvider } from './static-pix';

let _provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (_provider) return _provider;

  const name = process.env.PAYMENT_PROVIDER ?? 'static';
  switch (name) {
    case 'static':
      _provider = new StaticPixProvider();
      return _provider;
    // case 'asaas': _provider = new AsaasProvider(); return _provider;
    // case 'pagarme': _provider = new PagarmeProvider(); return _provider;
    default:
      throw new Error(`PAYMENT_PROVIDER desconhecido: ${name}`);
  }
}
