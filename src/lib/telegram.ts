import 'server-only';

/**
 * Notificação via Telegram (fail-open). Sem as envs TELEGRAM_BOT_TOKEN /
 * TELEGRAM_CHAT_ID, ou se a API falhar, não quebra o fluxo — apenas não notifica.
 * Usado pra avisar o anfitrião quando um convidado declara pagamento.
 */
export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
  } catch {
    // notificação nunca pode derrubar o request principal
  }
}
