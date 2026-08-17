import type { Material } from "./types";

export const FREE_SHIPPING_THRESHOLD_UAH = 1000;

export function qualifiesForFreeShipping(subtotal: number, hasItems: boolean) {
  return hasItems && subtotal > FREE_SHIPPING_THRESHOLD_UAH;
}

export function amountUntilFreeShippingUAH(subtotal: number) {
  return Math.max(0, FREE_SHIPPING_THRESHOLD_UAH - subtotal + 1);
}

export function estimateShippingWeightKg(items: { material?: Material; quantity: number }[]) {
  const weight = items.reduce((total, item) => {
    const unitWeight = item.material === "glass" ? 3.5 : item.material === "cloth" ? 0.9 : item.material === "dots" ? 0.15 : 0.5;
    return total + unitWeight * item.quantity;
  }, 0);
  return Math.max(0.5, Math.round(weight * 10) / 10);
}
