import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createOrder, getCatalogProducts } from "@/lib/database";
import { getArtisanStock } from "@/lib/artisan";
import { novaPoshtaRequest } from "@/lib/nova-poshta";
import { estimateShippingWeightKg, qualifiesForFreeShipping } from "@/lib/shipping";
import { isValidEmail, normalizeUkrainianPhone } from "@/lib/validation";

type SubmittedItem = {
  productId?: unknown;
  base?: unknown;
  size?: unknown;
  color?: unknown;
  quantity?: unknown;
};

type SubmittedOrder = {
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  email?: unknown;
  city?: unknown;
  cityRef?: unknown;
  warehouse?: unknown;
  warehouseRef?: unknown;
  comment?: unknown;
  items?: unknown;
};

type NovaPoshtaWarehouse = { Ref: string };
type DocumentPrice = { Cost: number | string };

const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toUpperCase();

export async function POST(request: Request) {
  let body: SubmittedOrder;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некоректні дані замовлення." }, { status: 400 });
  }

  const firstName = text(body.firstName, 80);
  const lastName = text(body.lastName, 80);
  const phoneInput = text(body.phone, 30);
  const phone = normalizeUkrainianPhone(phoneInput);
  const email = text(body.email, 160);
  const city = text(body.city, 160);
  const cityRef = text(body.cityRef, 36);
  const warehouse = text(body.warehouse, 300);
  const warehouseRef = text(body.warehouseRef, 36);
  const comment = text(body.comment, 1000);
  const refPattern = /^[a-f0-9-]{36}$/i;

  if (!firstName || !lastName || !phone || !isValidEmail(email)) {
    return NextResponse.json({ error: "Перевірте ім’я, номер телефону та email." }, { status: 400 });
  }
  if (!city || !warehouse || !refPattern.test(cityRef) || !refPattern.test(warehouseRef)) {
    return NextResponse.json({ error: "Перевірте місто та відділення Нової пошти." }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
    return NextResponse.json({ error: "Кошик порожній або містить забагато позицій." }, { status: 400 });
  }

  const submittedItems = body.items as SubmittedItem[];
  try {
    const products = await getCatalogProducts();
    const catalog = new Map(products.map((product) => [product.id, product]));
    const needsLiveStock = submittedItems.some((item) => catalog.get(text(item.productId, 120))?.syncSource === "artisan");
    const artisanStock = needsLiveStock ? await getArtisanStock() : null;
    const orderItems = submittedItems.map((item) => {
      const productId = text(item.productId, 120);
      const product = catalog.get(productId);
      const base = text(item.base, 100);
      const size = text(item.size, 100);
      const color = text(item.color, 100);
      const quantity = typeof item.quantity === "number" ? Math.floor(item.quantity) : 0;
      if (!product || product.stock === "out-of-stock" || !base || !size || !color || quantity < 1 || quantity > 20) throw new Error("INVALID_ITEM");
      let price: number;
      if (product.syncSource === "artisan") {
        const variants = artisanStock?.products[product.id]?.variants;
        const variant = variants?.find((value) => normalize(value.base) === normalize(base) && normalize(value.size) === normalize(size) && normalize(value.color) === normalize(color));
        if (variants?.length && (!variant?.inStock || typeof variant.retailUAH !== "number")) throw new Error("INVALID_VARIANT");
        price = Math.round(variant?.retailUAH ?? product.priceBySize?.[size] ?? product.price);
      } else {
        if (!product.bases.some((value) => normalize(value) === normalize(base)) || !product.sizes.some((value) => normalize(value) === normalize(size)) || !product.colors.some((value) => normalize(value.name) === normalize(color))) throw new Error("INVALID_VARIANT");
        price = Math.round(product.priceBySize?.[size] ?? product.price);
      }
      return { productId, name: product.name, base, size, color, price, quantity, material: product.material };
    });
    const subtotalUAH = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const weightKg = estimateShippingWeightKg(orderItems);

    const warehouses = await novaPoshtaRequest<NovaPoshtaWarehouse>("Address", "getWarehouses", { CityRef: cityRef, Limit: "500", Page: "1" });
    if (!warehouses.some((item) => item.Ref === warehouseRef)) {
      return NextResponse.json({ error: "Вибране відділення не належить зазначеному місту." }, { status: 400 });
    }

    let shippingUAH = 0;
    if (!qualifiesForFreeShipping(subtotalUAH, true)) {
      const senderCityRef = process.env.NOVA_POSHTA_SENDER_CITY_REF?.trim() ?? "";
      if (!refPattern.test(senderCityRef)) throw new Error("SENDER_CITY_NOT_CONFIGURED");
      const quote = await novaPoshtaRequest<DocumentPrice>("InternetDocument", "getDocumentPrice", {
        CitySender: senderCityRef,
        CityRecipient: cityRef,
        ServiceType: "WarehouseWarehouse",
        CargoType: "Parcel",
        Weight: String(weightKg),
        Cost: String(Math.max(300, subtotalUAH)),
        SeatsAmount: "1"
      });
      shippingUAH = Math.round(Number(quote[0]?.Cost));
      if (!Number.isFinite(shippingUAH) || shippingUAH < 0) throw new Error("INVALID_SHIPPING_QUOTE");
    }

    const orderNumber = `NG-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    await createOrder({
      id: randomUUID(), orderNumber, firstName, lastName, phone, email: email || null,
      city, cityRef, warehouse, warehouseRef, comment: comment || null, paymentMethod: "cod",
      items: orderItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        base: item.base,
        size: item.size,
        color: item.color,
        price: item.price,
        quantity: item.quantity
      })),
      subtotalUAH, shippingUAH, totalUAH: subtotalUAH + shippingUAH, weightKg
    });
    return NextResponse.json({ orderNumber });
  } catch (error) {
    if (error instanceof Error && (error.message === "INVALID_ITEM" || error.message === "INVALID_VARIANT")) {
      return NextResponse.json({ error: "Один із товарів або його варіант більше недоступний." }, { status: 409 });
    }
    console.error("Order creation failed", error);
    return NextResponse.json({ error: "Не вдалося створити замовлення. Спробуйте ще раз." }, { status: 503 });
  }
}
