import { NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/database";
import { jarPaymentLink } from "@/lib/monobank";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  if (!/^NG-[0-9A-Z]{6,12}-[0-9A-F]{4}$/.test(orderNumber)) {
    return NextResponse.json({ error: "Замовлення не знайдено." }, { status: 404 });
  }
  const order = await getOrderByNumber(orderNumber);
  if (!order) return NextResponse.json({ error: "Замовлення не знайдено." }, { status: 404 });
  return NextResponse.json({
    orderNumber: order.order_number,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    totalUAH: order.total_uah,
    payableKop: order.payable_kop,
    paidKop: order.paid_kop,
    link: order.payment_method === "jar" && order.payable_kop ? jarPaymentLink(order.payable_kop, order.order_number) : null
  }, { headers: { "Cache-Control": "no-store" } });
}
