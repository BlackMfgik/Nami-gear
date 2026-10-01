"use client";

import type { ArtisanStockResponse, Product } from "@/lib/types";
import { ProductDetails } from "./product-modal";
import { useArtisanStock } from "./use-artisan-stock";

export function ProductPurchase({ product, initialStock }: { product: Product; initialStock?: ArtisanStockResponse }) {
  const { data: stock } = useArtisanStock(initialStock);
  const variants = stock?.products[product.id]?.variants;
  return <ProductDetails key={`${product.id}-${variants?.length ?? 0}`} product={product} variants={variants} inline />;
}
