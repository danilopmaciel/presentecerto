/**
 * Gerador de BR Code (Pix EMV QR Code estático).
 *
 * Padrão: Manual do Pix — Banco Central do Brasil, "Padrões para iniciação do Pix",
 * versão Jun/2020 e atualizações, baseado em EMV® QRCPS Merchant-Presented Mode.
 *
 * Este módulo gera payloads compatíveis com QR estáticos (Point of Initiation = 11).
 * TX ID alfanumérico de 1–25 caracteres (sem espaços, sem acentos).
 */

// -------- TLV helper -------------------------------------------------------

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  if (id.length !== 2) throw new Error(`id EMV deve ter 2 dígitos (recebido: ${id})`);
  if (value.length > 99) throw new Error(`valor EMV longo demais (id ${id}): ${value.length}`);
  return id + len + value;
}

// -------- CRC-16/CCITT-FALSE ----------------------------------------------
// Polinômio 0x1021, inicial 0xFFFF, sem reflexão, sem xor final.

export function crc16Ccitt(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// -------- sanitização ------------------------------------------------------

/**
 * Remove acentos, caracteres não-ASCII e força caixa alta.
 * Aplicado a `merchantName` e `merchantCity`.
 */
export function sanitizeAscii(s: string, maxLen: number): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, maxLen);
}

/**
 * TX ID: alfanumérico, 1–25 chars, sem espaços ou acentos.
 * Se vazio ou inválido, usamos "***" (valor de "não informado" no padrão).
 */
export function sanitizeTxid(s: string | null | undefined): string {
  if (!s) return '***';
  const clean = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 25);
  return clean.length === 0 ? '***' : clean;
}

// -------- builder principal -----------------------------------------------

export type PixStaticInput = {
  pixKey: string;              // chave Pix do recebedor (CPF/CNPJ/e-mail/telefone/aleatória)
  merchantName: string;        // nome do recebedor — máx 25 chars ASCII
  merchantCity: string;        // cidade do recebedor — máx 15 chars ASCII
  amountCents?: number;        // opcional; se omitido, pagador digita no app
  txid?: string;               // opcional; default "***"
  infoAdicional?: string;      // mensagem curta para o pagador (max 72 chars ASCII)
};

/**
 * Monta o payload EMV do Pix estático (BR Code copia-e-cola).
 * O mesmo payload pode ser renderizado como QR code.
 */
export function buildPixStaticPayload(input: PixStaticInput): { payload: string; txid: string } {
  const merchantName = sanitizeAscii(input.merchantName, 25);
  const merchantCity = sanitizeAscii(input.merchantCity, 15);
  const txid = sanitizeTxid(input.txid);

  if (!input.pixKey || input.pixKey.length > 77) {
    throw new Error('pixKey inválida ou longa demais (máx 77 chars)');
  }
  if (merchantName.length === 0) throw new Error('merchantName vazio após sanitização');
  if (merchantCity.length === 0) throw new Error('merchantCity vazio após sanitização');

  // Merchant Account Information (id 26)
  const mai =
    tlv('00', 'BR.GOV.BCB.PIX') +
    tlv('01', input.pixKey) +
    (input.infoAdicional ? tlv('02', sanitizeAscii(input.infoAdicional, 72)) : '');

  // Additional Data Field Template (id 62) — carrega o txid (05)
  const addData = tlv('05', txid);

  let payload = '';
  payload += tlv('00', '01');                  // Payload Format Indicator
  payload += tlv('01', '11');                  // Point of Initiation Method: 11 = estático
  payload += tlv('26', mai);                   // Merchant Account Information
  payload += tlv('52', '0000');                // Merchant Category Code
  payload += tlv('53', '986');                 // Transaction Currency: BRL
  if (typeof input.amountCents === 'number' && input.amountCents > 0) {
    const amount = (input.amountCents / 100).toFixed(2);
    if (amount.length > 13) throw new Error('valor excede 13 dígitos');
    payload += tlv('54', amount);              // Transaction Amount
  }
  payload += tlv('58', 'BR');                  // Country Code
  payload += tlv('59', merchantName);          // Merchant Name
  payload += tlv('60', merchantCity);          // Merchant City
  payload += tlv('62', addData);               // Additional Data Field Template

  // CRC16 do payload + "6304"
  const toChecksum = payload + '6304';
  const crc = crc16Ccitt(toChecksum);
  payload = toChecksum + crc;

  return { payload, txid };
}
