import { CheckoutForm } from "@/components/checkout-form";
import { jarUrl } from "@/lib/monobank";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutForm jarEnabled={Boolean(jarUrl())} />;
}
