import type { ArtisanStockResponse, GlideType, Material, Product } from "./types";

export const typeLabels: Record<GlideType, string> = {
  balanced: "Баланс",
  control: "Контроль",
  speed: "Швидкість"
};

export const materialLabels: Record<Material, string> = {
  cloth: "Тканинний килимок",
  glass: "Скляний килимок"
};

export const ARTISAN_LEAD_TIME = "Під замовлення · 2–4 тижні";

export const formatUAH = (price: number) => `₴${Math.round(price).toLocaleString("uk-UA")}`;

export function applyArtisanStock(products: Product[], stock?: ArtisanStockResponse) {
  return products.map((product) => {
    const entry = stock?.products[product.id];
    if (!product.syncSource || !entry?.variants) return product;
    const prices = entry.variants.map((variant) => variant.retailUAH).filter((price): price is number => typeof price === "number");
    return {
      ...product,
      price: prices.length ? Math.min(...prices) : product.price,
      stock: entry.inStock ? "in-stock" as const : "out-of-stock" as const
    };
  });
}

const mousepadSizeOrder = new Map([
  ["XS", 0],
  ["S", 1],
  ["M", 2],
  ["L", 3],
  ["XL", 4],
  ["XXL", 5],
  ["2XL", 5],
  ["XXXL", 6],
  ["3XL", 6],
  ["4XL", 7]
]);

function mousepadSizeRank(size: string) {
  const normalized = size.trim().replace(/[\s_-]+/g, "").toUpperCase();
  const namedRank = mousepadSizeOrder.get(normalized);
  if (namedRank !== undefined) return namedRank;

  const dimensions = normalized.match(/(\d+(?:[.,]\d+)?)\D+(\d+(?:[.,]\d+)?)/);
  if (dimensions) return 100 + Number(dimensions[1].replace(",", ".")) * Number(dimensions[2].replace(",", "."));

  return Number.POSITIVE_INFINITY;
}

export function sortMousepadSizes(sizes: string[]) {
  return [...sizes].sort((left, right) => {
    const leftRank = mousepadSizeRank(left);
    const rightRank = mousepadSizeRank(right);
    if (leftRank !== rightRank) return leftRank < rightRank ? -1 : 1;
    return left.localeCompare(right, "uk-UA", { numeric: true, sensitivity: "base" });
  });
}
