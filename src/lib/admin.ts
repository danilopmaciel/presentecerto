/**
 * Lista de e-mails que têm acesso ao painel admin.
 * Pra adicionar/remover, edita aqui ou seta `ADMIN_EMAILS` na Vercel
 * (separados por vírgula). O e-mail base sempre fica.
 */
const BASE_ADMIN_EMAILS = ['danilopmaciel@gmail.com'];

export function getAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([...BASE_ADMIN_EMAILS.map((s) => s.toLowerCase()), ...fromEnv]));
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
