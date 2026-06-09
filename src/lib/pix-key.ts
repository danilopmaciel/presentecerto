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

/** Valida CPF pelo dígito verificador (módulo 11). Recebe 11 dígitos puros. */
function isValidCpfDigits(digits: string): boolean {
  if (digits.length !== 11) return false;
  // CPFs com todos os dígitos iguais são inválidos (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  if (r !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  return r === parseInt(digits[10]);
}

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

  // 11 dígitos puros: usa checksum CPF como desempate confiável.
  // Se passar no módulo 11, é CPF; caso contrário, trata como celular.
  if (digits.length === 11) {
    return isValidCpfDigits(digits) ? 'cpf' : 'phone';
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
    // CPF mascarado (com pontos) → retorna só dígitos
    if (raw.includes('.')) return digits;
    // Telefone mascarado (parênteses, traço, espaço) → E.164
    if (/[()\s-]/.test(raw)) return '+55' + digits;
    // 11 dígitos puros sem formatação: usa checksum CPF como desempate.
    // Isso evita confundir um CPF cujo 3º dígito é '9' com celular.
    if (isValidCpfDigits(digits)) return digits; // CPF
    return '+55' + digits; // celular
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
