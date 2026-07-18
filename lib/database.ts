import { neon } from "@neondatabase/serverless";
import type { Product } from "./types";

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
    colors: row.colors,
    priceBySize: row.price_by_size ?? undefined,
    syncSource: row.sync_source ?? undefined,
    origin: row.origin
  }));
}

