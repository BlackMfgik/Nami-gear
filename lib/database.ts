import type { Product } from "./types";
import { attachProductColorImages } from "./product-color-images";
import { ensureSchema, getSql } from "./db";

type ProductRow = {
  id: string;
  name: string;
  brand: string;
  category: Product["category"];
  material: Product["material"];
  glide_type: Product["type"];
  series: string;
  tagline: string;
  price: number;
  stock: Product["stock"];
  image_url: string;
  gallery_urls: string[];
  bases: string[];
  sizes: string[];
  colors: Product["colors"];
  price_by_size: Record<string, number> | null;
  sync_source: Product["syncSource"] | null;
  origin: string;
};

export async function getCatalogProducts(): Promise<Product[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM products ORDER BY created_at, id` as ProductRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    material: row.material,
    type: row.glide_type,
    series: row.series,
    tagline: row.tagline,
    price: Number(row.price),
    stock: row.stock,
    image: row.image_url,
    gallery: row.gallery_urls,
    bases: row.bases,
    sizes: row.sizes,
    colors: attachProductColorImages(row.id, row.colors),
    priceBySize: row.price_by_size ?? undefined,
    syncSource: row.sync_source ?? undefined,
    origin: row.origin
  }));
}

export type PaymentMethod = "cod" | "jar";
export type PaymentStatus = "not_required" | "pending" | "partial" | "paid" | "expired" | "cancelled";

export type NewOrder = {
  id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  city: string;
  cityRef: string;
  warehouse: string;
  warehouseRef: string;
  comment: string | null;
  paymentMethod: PaymentMethod;
  items: {
    productId: string;
    name: string;
    base: string;
    size: string;
    color: string;
    price: number;
    quantity: number;
  }[];
  subtotalUAH: number;
  shippingUAH: number;
  totalUAH: number;
  weightKg: number;
};

export type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  warehouse: string;
  comment: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  items: NewOrder["items"];
  total_uah: number;
  payable_kop: number | null;
  paid_kop: number;
  paid_at: string | Date | null;
  created_at: string | Date;
};

// Unique kopecks let a jar payment be matched by amount when the payer omits the comment.
async function uniquePayableKop(totalUAH: number) {
  const base = totalUAH * 100;
  const used = await getSql()`
    SELECT payable_kop FROM orders
    WHERE payment_status IN ('pending', 'partial', 'expired') AND payable_kop BETWEEN ${base} AND ${base + 99}
  ` as { payable_kop: number }[];
  const taken = new Set(used.map((row) => row.payable_kop - base));
  const free = Array.from({ length: 99 }, (_, index) => index + 1).filter((kop) => !taken.has(kop));
  const pool = free.length ? free : Array.from({ length: 99 }, (_, index) => index + 1);
  return base + pool[Math.floor(Math.random() * pool.length)];
}

export async function createOrder(order: NewOrder) {
  await ensureSchema();
  const sql = getSql();
  const payableKop = order.paymentMethod === "jar" ? await uniquePayableKop(order.totalUAH) : null;
  const paymentStatus: PaymentStatus = order.paymentMethod === "jar" ? "pending" : "not_required";

  await sql`
    INSERT INTO orders (
      id, order_number, first_name, last_name, phone, email, city, city_ref,
      warehouse, warehouse_ref, comment, payment_method, items, subtotal_uah,
      shipping_uah, total_uah, weight_kg, payment_status, payable_kop
    ) VALUES (
      ${order.id}, ${order.orderNumber}, ${order.firstName}, ${order.lastName},
      ${order.phone}, ${order.email}, ${order.city}, ${order.cityRef},
      ${order.warehouse}, ${order.warehouseRef}, ${order.comment}, ${order.paymentMethod},
      ${JSON.stringify(order.items)}::jsonb, ${order.subtotalUAH}, ${order.shippingUAH},
      ${order.totalUAH}, ${order.weightKg}, ${paymentStatus}, ${payableKop}
    )
  `;
  return { payableKop, paymentStatus };
}

export async function getOrderByNumber(orderNumber: string) {
  await ensureSchema();
  const rows = await getSql()`SELECT * FROM orders WHERE order_number = ${orderNumber}` as OrderRow[];
  return rows[0] ?? null;
}
