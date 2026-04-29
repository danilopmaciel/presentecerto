/**
 * Notificações pro admin via Telegram.
 * Configure as ENVs na Vercel:
 *   TELEGRAM_BOT_TOKEN  → token do BotFather
 *   TELEGRAM_CHAT_ID    → seu chat_id (consulta com @userinfobot)
 *
 * Se as ENVs não estiverem setadas, a função vira no-op (silenciosa).
 * Falhas no Telegram nunca derrubam o request principal.
 */
export async function notifyAdmin(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
      // 5s — não trava o request principal
      signal: AbortSignal.timeout(5000)
    });
  } catch {
    // Silencioso de propósito — nunca falha o fluxo principal
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
