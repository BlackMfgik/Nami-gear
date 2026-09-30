import { NextResponse } from "next/server";
import { cancelOrder, linkPayment, listPendingOrders, markOrderPaid } from "@/lib/payments";
import { matchesSecret } from "@/lib/secrets";
import { notifyOwner, telegramConfig } from "@/lib/telegram";

export const dynamic = "force-dynamic";

type Update = { message?: { chat?: { id?: number }; text?: string } };

const help = [
  "<b>Команди</b>",
  "/pending: замовлення, що чекають оплату",
  "/paid NG-…: позначити оплаченим вручну",
  "/link ID NG-…: прив'язати платіж без збігу",
  "/cancel NG-…: скасувати замовлення"
].join("\n");

async function handle(text: string) {
  const [command, ...args] = text.trim().split(/\s+/);
  switch (command.split("@")[0]) {
    case "/pending": return listPendingOrders();
    case "/paid": return args[0] ? markOrderPaid(args[0]) : "Вкажіть номер: /paid NG-…";
    case "/link": return args.length === 2 ? linkPayment(args[0], args[1]) : "Формат: /link ID NG-…";
    case "/cancel": return args[0] ? cancelOrder(args[0]) : "Вкажіть номер: /cancel NG-…";
    default: return help;
  }
}

export async function POST(request: Request) {
  if (!matchesSecret(request.headers.get("x-telegram-bot-api-secret-token"), process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return new NextResponse("forbidden", { status: 403 });
  }
  const config = telegramConfig();
  const update = await request.json().catch(() => ({})) as Update;
  const text = update.message?.text;
  if (!config || !text || String(update.message?.chat?.id) !== config.chatId) return NextResponse.json({ ok: true });
  try {
    await notifyOwner(await handle(text));
  } catch (error) {
    console.error("Telegram command failed", error);
    await notifyOwner("Помилка під час виконання команди. Подивіться логи сервера.");
  }
  return NextResponse.json({ ok: true });
}
