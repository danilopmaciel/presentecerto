import {
  buildPixStaticPayload,
  sanitizeAscii,
  sanitizeTxid
} from './pix-emv';
import type {
  CreateChargeInput,
  CreateChargeResult,
  PaymentProvider,
  WebhookPayment
} from './index';

/**
 * Fase 1: gera Pix estático (copia-e-cola + QR) apontando para a chave Pix do recebedor.
 * Não custodia e não confirma automaticamente — confirmação é manual pelo anfitrião.
 */
export class StaticPixProvider implements PaymentProvider {
  readonly name = 'static';

  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    const receiver = input.receiver ?? {
      pixKey: process.env.SAAS_PIX_KEY ?? '',
      merchantName: process.env.SAAS_PIX_MERCHANT_NAME ?? 'PRESENTENOPIX',
      merchantCity: process.env.SAAS_PIX_MERCHANT_CITY ?? 'SAO PAULO'
    };

    if (!receiver.pixKey) {
      throw new Error('Chave Pix do recebedor ausente');
    }

    // txid derivado da referência (ex.: uuid sem hífen truncado em 25)
    const txid = sanitizeTxid(input.externalReference.replace(/-/g, ''));

    const { payload } = buildPixStaticPayload({
      pixKey: receiver.pixKey,
      merchantName: sanitizeAscii(receiver.merchantName, 25),
      merchantCity: sanitizeAscii(receiver.merchantCity, 15),
      amountCents: input.amountCents,
      txid,
      infoAdicional: input.description
    });

    const expiresIn = input.expiresInSeconds ?? 30 * 60; // 30 min default
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      providerExternalId: null,
      pixPayload: payload,
      pixTxid: txid,
      expiresAt
    };
  }

  verifyWebhookSignature(_rawBody: string, _signature: string | null): boolean {
    // Pix estático não tem webhook — confirmação é manual.
    return false;
  }

  parseWebhook(_payload: unknown): WebhookPayment {
    throw new Error('StaticPixProvider não suporta webhooks');
  }
}
