import type { MetadataRoute } from "next";
import { getCatalogProducts } from "@/lib/database";
import { productPath, SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCatalogProducts();
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/artisan`, changeFrequency: "weekly", priority: 0.9 },
    ...products.map((product) => ({ url: `${SITE_URL}${productPath(product.id)}`, changeFrequency: "daily" as const, priority: 0.8 }))
  ];
}
