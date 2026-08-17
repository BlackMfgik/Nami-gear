import type { Product } from "@/lib/types";
import { getProductColorImage } from "@/lib/product-color-images";

type ProductVisualData = Pick<Product, "brand" | "name" | "image"> & Partial<Pick<Product, "id" | "colors">>;

export function ProductVisual({ product, color, className = "" }: { product: ProductVisualData; color?: string; className?: string }) {
  const image = product.id && product.colors ? getProductColorImage({ ...product, id: product.id, colors: product.colors }, color) : product.image;

  return (
    <div className={`overflow-hidden bg-[#f3f2ef] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="h-full w-full object-cover transition duration-500 ease-out"
        src={image}
        alt={`${product.brand} ${product.name}${color ? `, ${color}` : ""}`}
      />
    </div>
  );
}
