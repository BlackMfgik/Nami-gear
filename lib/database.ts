import { neon } from "@neondatabase/serverless";
import type { Product } from "./types";
import { attachProductColorImages } from "./product-color-images";

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
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

  const sql = neon(databaseUrl);
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
  paymentMethod: "cod";
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

export async function createOrder(order: NewOrder) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
  const sql = neon(databaseUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id text PRIMARY KEY,
      order_number text UNIQUE NOT NULL,
      status text NOT NULL DEFAULT 'new',
      first_name text NOT NULL,
      last_name text NOT NULL,
      phone text NOT NULL,
      email text,
      city text NOT NULL,
      city_ref text NOT NULL,
      warehouse text NOT NULL,
      warehouse_ref text NOT NULL,
      comment text,
      payment_method text NOT NULL,
      items jsonb NOT NULL,
      subtotal_uah integer NOT NULL,
      shipping_uah integer NOT NULL,
      total_uah integer NOT NULL,
      weight_kg numeric(8, 2) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    INSERT INTO orders (
      id, order_number, first_name, last_name, phone, email, city, city_ref,
      warehouse, warehouse_ref, comment, payment_method, items, subtotal_uah,
      shipping_uah, total_uah, weight_kg
    ) VALUES (
      ${order.id}, ${order.orderNumber}, ${order.firstName}, ${order.lastName},
      ${order.phone}, ${order.email}, ${order.city}, ${order.cityRef},
      ${order.warehouse}, ${order.warehouseRef}, ${order.comment}, ${order.paymentMethod},
      ${JSON.stringify(order.items)}::jsonb, ${order.subtotalUAH}, ${order.shippingUAH},
      ${order.totalUAH}, ${order.weightKg}
    )
  `;
}
