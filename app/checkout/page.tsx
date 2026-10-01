import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { jarUrl } from "@/lib/monobank";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Оформлення замовлення",
  robots: { index: false, follow: false }
};

export default function CheckoutPage() {
  return <CheckoutForm jarEnabled={Boolean(jarUrl())} />;
}
