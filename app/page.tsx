import { Storefront } from "@/components/storefront";
import { getCatalogProducts } from "@/lib/database";

export const revalidate = 60;

export default async function HomePage() {
  const products = await getCatalogProducts();
  return <Storefront initialProducts={products} />;
}
