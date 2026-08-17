import type { GlideType, Material } from "./types";

export const typeLabels: Record<GlideType, string> = {
  balanced: "Баланс",
  control: "Контроль",
  speed: "Швидкість",
  quiet: "Тихі",
  durable: "Зносостійкі"
};

export const materialLabels: Record<Material, string> = {
  cloth: "Тканинний килимок",
  glass: "Скляний килимок",
  dots: "Точки-глайди"
};

export const formatUAH = (price: number) => `₴${Math.round(price).toLocaleString("uk-UA")}`;

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
