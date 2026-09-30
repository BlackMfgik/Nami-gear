export const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function telegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() ?? "";
  return token && chatId ? { token, chatId } : null;
}

export async function notifyOwner(html: string) {
  const config = telegramConfig();
  if (!config) return;
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: config.chatId, text: html, parse_mode: "HTML", link_preview_options: { is_disabled: true } }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) console.error("Telegram sendMessage failed", response.status, await response.text());
  } catch (error) {
    console.error("Telegram sendMessage failed", error);
  }
}
