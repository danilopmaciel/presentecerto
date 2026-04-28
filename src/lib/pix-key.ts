/**
 * Normaliza uma chave Pix pro formato exigido pelo BR Code:
 * - Telefone → E.164 com +55
 * - Email → minúsculo
 * - EVP (UUID aleatória) → minúsculo
 * - CPF → 11 dígitos sem máscara
 * - CNPJ → 14 dígitos sem máscara
 */

export type PixKeyKind = 'phone' | 'email' | 'evp' | 'cpf' | 'cnpj' | 'unknown';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function detectPixKeyKind(input: string): PixKeyKind {
  const raw = input.trim();
  if (!raw) return 'unknown';
  if (UUID_RE.test(raw)) return 'evp';
  if (raw.includes('@') && /\S+@\S+\.\S+/.test(raw)) return 'email';

  const digits = raw.replace(/\D/g, '');
  if (digits.length === 14) return 'cnpj';
  if (digits.length === 10) return 'phone';
  if (raw.startsWith('+') || /[()\s-]/.test(raw)) {
    if (digits.length === 11 || digits.length === 12 || digits.length === 13) {
      return 'phone';
    }
  }
  if (raw.includes('.') && digits.length === 11) return 'cpf';

  // 11 dígitos puros: heurística — celular brasileiro tem 9 logo após o DDD
  if (digits.length === 11) {
    if (digits[2] === '9') return 'phone';
    return 'cpf';
  }
  return 'unknown';
}

export function normalizePixKey(input: string): string {
  const raw = input.trim();
  if (!raw) return '';

  // Já vem com + → mantém só dígitos com +
  if (raw.startsWith('+')) {
    return '+' + raw.replace(/\D/g, '');
  }

  if (UUID_RE.test(raw)) return raw.toLowerCase();

  if (raw.includes('@') && /\S+@\S+\.\S+/.test(raw)) return raw.toLowerCase();

  const digits = raw.replace(/\D/g, '');

  // CNPJ
  if (digits.length === 14) return digits;

  // Telefone fixo (10 dígitos) → +55
  if (digits.length === 10) return '+55' + digits;

  // 12-13 dígitos começando com 55 (já com país, sem +)
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return '+' + digits;
  }

  if (digits.length === 11) {
    // CPF mascarado (com pontos)
    if (raw.includes('.')) return digits;
    // Telefone mascarado (parênteses, traço, espaço)
    if (/[()\s-]/.test(raw)) return '+55' + digits;
    // Sem formatação: heurística — celular começa com 9 depois do DDD
    if (digits[2] === '9') return '+55' + digits;
    return digits; // CPF
  }

  // Não consegui identificar — devolve como veio
  return raw;
}

export function describePixKey(input: string): string {
  switch (detectPixKeyKind(input)) {
    case 'phone':
      return 'Telefone';
    case 'email':
      return 'E-mail';
    case 'evp':
      return 'Chave aleatória';
    case 'cpf':
      return 'CPF';
    case 'cnpj':
      return 'CNPJ';
    default:
      return 'Chave';
  }
}
