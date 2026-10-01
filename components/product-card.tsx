"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import type { Product } from "@/lib/types";
import { ARTISAN_LEAD_TIME, formatUAH, materialLabels } from "@/lib/catalog";
import { productPath } from "@/lib/site";
import { ProductVisual } from "./product-visual";

const stockLabels = {
  preorder: { text: "Уточнюємо", classes: "bg-orange-100 text-orange-800" },
  "out-of-stock": { text: "Немає", classes: "bg-red-100 text-red-800" }
};

export function ProductCard({ product, onSelect }: { product: Product; onSelect: (product: Product) => void }) {
  const badge = product.stock === "in-stock" && product.syncSource === "artisan"
    ? { text: ARTISAN_LEAD_TIME, classes: "bg-amber-100 text-amber-900" }
    : product.stock === "in-stock" ? null : stockLabels[product.stock];
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const selectedProduct = () => ({
    ...product,
    colors: [
      ...product.colors.filter((item) => item.name === color),
      ...product.colors.filter((item) => item.name !== color)
    ]
  });

  // Plain clicks open the quick-view modal; crawlers and modified clicks follow the product page link.
  const openQuickView = (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onSelect(selectedProduct());
  };

  return (
    <article className="group overflow-hidden rounded-3xl border border-black/[.04] bg-white shadow-card transition hover:-translate-y-1 hover:shadow-soft">
      <Link href={productPath(product.id)} onClick={openQuickView} className="relative block aspect-[4/3] w-full overflow-hidden text-left">
        {badge && <span className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1.5 font-mono text-[9px] font-semibold uppercase ${badge.classes}`}>{badge.text}</span>}
        <ProductVisual product={product} color={color} className="h-full w-full" />
      </Link>
      <div className="flex min-h-60 flex-col p-5">
        <p className="font-mono text-[9px] uppercase tracking-widest text-warm">{product.brand} · {materialLabels[product.material]}</p>
        <Link href={productPath(product.id)} onClick={openQuickView} className="mt-2 text-left text-lg font-semibold hover:text-warm">{product.name}</Link>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{product.tagline}</p>
        {product.colors.length > 0 && (
          <div className="mt-4 flex items-center gap-2" aria-label={`Колір: ${color}`}>
            {product.colors.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setColor(item.name)}
                className={`grid size-7 place-items-center rounded-full border-2 transition hover:scale-110 ${color === item.name ? "border-ink" : "border-white ring-1 ring-line"}`}
                style={{ backgroundColor: item.hex }}
                title={item.name}
                aria-label={`Колір ${item.name}`}
                aria-pressed={color === item.name}
              >
                {color === item.name && <Check className="size-3.5 text-white mix-blend-difference" />}
              </button>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="font-display text-base font-bold">від {formatUAH(product.price)}</span>
          <button className="btn-primary min-h-10 px-4" onClick={() => onSelect(selectedProduct())}>Обрати</button>
        </div>
      </div>
    </article>
  );
}
