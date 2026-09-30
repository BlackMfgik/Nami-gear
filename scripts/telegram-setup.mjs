// npm run telegram:setup [-- --webhook <origin>]
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured (create a bot with @BotFather)");
const api = (method, body) => fetch(`https://api.telegram.org/bot${token}/${method}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body ?? {})
}).then((response) => response.json());

const webhookIndex = process.argv.indexOf("--webhook");
if (webhookIndex > 0) {
  const origin = process.argv[webhookIndex + 1]?.replace(/\/$/, "");
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!origin?.startsWith("https://")) throw new Error("Pass the site origin, e.g. https://nami-gear.vercel.app");
  if (!secret || secret.length < 16) throw new Error("TELEGRAM_WEBHOOK_SECRET must be at least 16 characters");
  console.log(await api("setWebhook", { url: `${origin}/api/telegram/webhook`, secret_token: secret, allowed_updates: ["message"] }));
  console.log(await api("setMyCommands", { commands: [
    { command: "pending", description: "Замовлення, що чекають оплату" },
    { command: "paid", description: "Позначити оплаченим: /paid NG-…" },
    { command: "link", description: "Прив'язати платіж: /link ID NG-…" },
    { command: "cancel", description: "Скасувати: /cancel NG-…" }
  ] }));
} else {
  const updates = await api("getUpdates");
  const chats = new Map((updates.result ?? []).map((update) => [update.message?.chat.id, update.message?.chat]).filter(([id]) => id));
  if (!chats.size) console.log("No messages yet. Send /start to your bot and run this again (works only before the webhook is set).");
  for (const [id, chat] of chats) console.log(`TELEGRAM_CHAT_ID=${id}  (${chat.first_name ?? chat.title ?? ""})`);
}
