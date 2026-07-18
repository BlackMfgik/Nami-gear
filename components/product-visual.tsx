import type { Product } from "@/lib/types";

type ProductVisualData = Pick<Product, "brand" | "name" | "image">;

export function ProductVisual({ product, className = "" }: { product: ProductVisualData; className?: string }) {
  const artisanPhoto = product.brand === "Artisan";

  return (
    <div className={`overflow-hidden bg-[#f3f2ef] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={`h-full w-full ${artisanPhoto ? "product-photo object-cover" : "object-contain"}`}
        src={product.image}
        alt={`${product.brand} ${product.name}`}
      />
    </div>
  );
}
