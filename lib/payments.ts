import { ensureSchema, getSql } from "./db";
import type { OrderRow } from "./database";
import { fetchJarStatement, monoConfig, type MonoStatementItem } from "./monobank";
import { escapeHtml, notifyOwner } from "./telegram";

export const PAYMENT_EXPIRY_HOURS = 48;
const AMOUNT_MATCH_DAYS = 7;

const ORDER_NUMBER_PATTERN = /NG-[0-9A-Z]{6,12}-[0-9A-F]{4}/i;

export const formatKop = (kop: number) => `${(kop / 100).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн`;

function orderSummary(order: OrderRow) {
  const items = order.items.map((item) => `${escapeHtml(item.name)} ${escapeHtml(item.size)} ${escapeHtml(item.color)} ×${item.quantity}`).join(", ");
  return `${items}\n${escapeHtml(order.first_name)} ${escapeHtml(order.last_name)}, ${escapeHtml(order.phone)}\n${escapeHtml(order.city)}, ${escapeHtml(order.warehouse)}`;
}

export async function notifyNewOrder(order: OrderRow) {
  const payment = order.payment_method === "jar" && order.payable_kop
    ? `💳 Передоплата на банку: <b>${formatKop(order.payable_kop)}</b>, чекаємо оплату`
    : `📦 Оплата при отриманні: <b>${order.total_uah} грн</b>`;
  await notifyOwner(`🆕 Замовлення <code>${order.order_number}</code>\n${payment}\n${orderSummary(order)}${order.comment ? `\n💬 ${escapeHtml(order.comment)}` : ""}`);
}

async function applyPayment(orderId: string, paymentId: string, amountKop: number) {
  const sql = getSql();
  const rows = await sql`
    UPDATE orders SET
      paid_kop = paid_kop + ${amountKop},
      payment_status = CASE WHEN paid_kop + ${amountKop} >= payable_kop THEN 'paid' ELSE 'partial' END,
      paid_at = CASE WHEN paid_kop + ${amountKop} >= payable_kop THEN now() ELSE paid_at END
    WHERE id = ${orderId} AND payment_method = 'jar' AND payment_status <> 'cancelled'
    RETURNING *
  ` as OrderRow[];
  if (rows[0]) await sql`UPDATE jar_payments SET order_id = ${orderId} WHERE id = ${paymentId}`;
  return rows[0] ?? null;
}

async function findOrderForPayment(amountKop: number, text: string) {
  const sql = getSql();
  const orderNumber = text.match(ORDER_NUMBER_PATTERN)?.[0].toUpperCase();
  if (orderNumber) {
    const byNumber = await sql`SELECT * FROM orders WHERE order_number = ${orderNumber} AND payment_method = 'jar'` as OrderRow[];
    if (byNumber[0]) return { order: byNumber[0], matchedBy: "comment" as const };
  }
  const byAmount = await sql`
    SELECT * FROM orders
    WHERE payment_status IN ('pending', 'expired') AND payable_kop = ${amountKop}
      AND created_at > now() - make_interval(days => ${AMOUNT_MATCH_DAYS})
  ` as OrderRow[];
  return byAmount.length === 1 ? { order: byAmount[0], matchedBy: "amount" as const } : null;
}

export async function processJarTransaction(account: string, item: MonoStatementItem) {
  if (!(item.amount > 0)) return { status: "ignored" as const };
  await ensureSchema();
  const sql = getSql();
  const inserted = await sql`
    INSERT INTO jar_payments (id, account, amount_kop, description, comment, paid_at, raw)
    VALUES (${item.id}, ${account}, ${item.amount}, ${item.description ?? null}, ${item.comment ?? null},
      to_timestamp(${item.time}), ${JSON.stringify(item)}::jsonb)
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  ` as { id: string }[];
  if (!inserted.length) return { status: "duplicate" as const };

  const payer = item.description ? escapeHtml(item.description) : "невідомо";
  const commentLine = item.comment ? `\n💬 ${escapeHtml(item.comment)}` : "";
  const match = await findOrderForPayment(item.amount, `${item.comment ?? ""} ${item.description ?? ""}`);
  const order = match && await applyPayment(match.order.id, item.id, item.amount);
  if (!order) {
    await notifyOwner(`⚠️ Надходження на банку без збігу: <b>${formatKop(item.amount)}</b>\nВід: ${payer}${commentLine}\nID: <code>${escapeHtml(item.id)}</code>\nПрив'язати: <code>/link ${escapeHtml(item.id)} NG-…</code>`);
    return { status: "unmatched" as const };
  }
  const how = match.matchedBy === "comment" ? "за номером у коментарі" : "за сумою";
  const payable = order.payable_kop ?? 0;
  if (order.payment_status === "paid") {
    const extra = order.paid_kop > payable ? `\n❗ Переплата: ${formatKop(order.paid_kop - payable)}` : "";
    await notifyOwner(`✅ <code>${order.order_number}</code> оплачено ${formatKop(item.amount)} (${how})${extra}\nВід: ${payer}${commentLine}\n${orderSummary(order)}`);
  } else {
    await notifyOwner(`🟡 <code>${order.order_number}</code> часткова оплата ${formatKop(item.amount)} (${how})\nСплачено ${formatKop(order.paid_kop)} з ${formatKop(payable)}\nВід: ${payer}${commentLine}`);
  }
  return { status: "matched" as const, orderNumber: order.order_number };
}

export async function linkPayment(paymentId: string, orderNumber: string) {
  await ensureSchema();
  const sql = getSql();
  const payments = await sql`SELECT id, amount_kop, order_id FROM jar_payments WHERE id = ${paymentId}` as { id: string; amount_kop: number; order_id: string | null }[];
  const payment = payments[0];
  if (!payment) return "Платіж не знайдено.";
  if (payment.order_id) return "Цей платіж уже прив'язаний до замовлення.";
  const orders = await sql`SELECT id FROM orders WHERE order_number = ${orderNumber.toUpperCase()} AND payment_method = 'jar'` as { id: string }[];
  if (!orders[0]) return "Замовлення з передоплатою на банку не знайдено.";
  const order = await applyPayment(orders[0].id, payment.id, payment.amount_kop);
  if (!order) return "Замовлення скасоване, платіж не прив'язано.";
  return `Прив'язано. Статус ${order.order_number}: ${order.payment_status === "paid" ? "оплачено ✅" : `сплачено ${formatKop(order.paid_kop)} з ${formatKop(order.payable_kop ?? 0)}`}`;
}

export async function markOrderPaid(orderNumber: string) {
  await ensureSchema();
  const rows = await getSql()`
    UPDATE orders SET payment_status = 'paid', paid_at = now(), paid_kop = GREATEST(paid_kop, COALESCE(payable_kop, 0))
    WHERE order_number = ${orderNumber.toUpperCase()} AND payment_method = 'jar'
    RETURNING order_number
  ` as { order_number: string }[];
  return rows[0] ? `${rows[0].order_number} позначено як оплачене ✅` : "Замовлення з передоплатою на банку не знайдено.";
}

export async function cancelOrder(orderNumber: string) {
  await ensureSchema();
  const rows = await getSql()`
    UPDATE orders SET status = 'cancelled', payment_status = CASE WHEN payment_method = 'jar' AND payment_status <> 'paid' THEN 'cancelled' ELSE payment_status END
    WHERE order_number = ${orderNumber.toUpperCase()}
    RETURNING order_number, payment_status
  ` as { order_number: string; payment_status: string }[];
  if (!rows[0]) return "Замовлення не знайдено.";
  return `${rows[0].order_number} скасовано.${rows[0].payment_status === "paid" ? " Увага: замовлення вже оплачене, поверніть кошти вручну." : ""}`;
}

export async function listPendingOrders() {
  await ensureSchema();
  const rows = await getSql()`
    SELECT order_number, payable_kop, paid_kop, payment_status, first_name, last_name, created_at FROM orders
    WHERE payment_status IN ('pending', 'partial') ORDER BY created_at DESC LIMIT 30
  ` as OrderRow[];
  if (!rows.length) return "Немає замовлень, що очікують оплату.";
  return rows.map((row) => `<code>${row.order_number}</code> ${formatKop(row.payable_kop ?? 0)}${row.payment_status === "partial" ? ` (сплачено ${formatKop(row.paid_kop)})` : ""} · ${escapeHtml(row.first_name)} ${escapeHtml(row.last_name)}`).join("\n");
}

export async function expireUnpaidOrders() {
  await ensureSchema();
  const rows = await getSql()`
    UPDATE orders SET payment_status = 'expired'
    WHERE payment_status = 'pending' AND created_at < now() - make_interval(hours => ${PAYMENT_EXPIRY_HOURS})
    RETURNING order_number, payable_kop, first_name, last_name, phone
  ` as OrderRow[];
  for (const row of rows) {
    await notifyOwner(`⏰ <code>${row.order_number}</code> не оплачено за ${PAYMENT_EXPIRY_HOURS} год (${formatKop(row.payable_kop ?? 0)})\n${escapeHtml(row.first_name)} ${escapeHtml(row.last_name)}, ${escapeHtml(row.phone)}\nСкасувати: <code>/cancel ${row.order_number}</code>`);
  }
  return rows.length;
}

export async function pollJarPayments() {
  const config = monoConfig();
  if (!config) return { enabled: false, processed: 0 };
  const items = await fetchJarStatement();
  let processed = 0;
  for (const item of items) {
    const result = await processJarTransaction(config.jarId, item);
    if (result.status !== "duplicate" && result.status !== "ignored") processed += 1;
  }
  return { enabled: true, processed };
}
