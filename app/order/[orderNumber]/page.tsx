import type { Metadata } from "next";
import { OrderPayment } from "@/components/order-payment";

export const metadata: Metadata = {
  title: "Оплата замовлення · Nami Gear",
  robots: { index: false, follow: false }
};

export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <OrderPayment orderNumber={decodeURIComponent(orderNumber).toUpperCase()} />;
}
