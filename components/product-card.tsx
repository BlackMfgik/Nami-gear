"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatUAH, materialLabels } from "@/lib/catalog";
import { ProductVisual } from "./product-visual";

const stockLabels = {
  "in-stock": { text: "В наявності", classes: "bg-green-100 text-green-800" },
  preorder: { text: "Уточнюємо", classes: "bg-orange-100 text-orange-800" },
  "out-of-stock": { text: "Немає", classes: "bg-red-100 text-red-800" }
};

export function ProductCard({ product, onSelect }: { product: Product; onSelect: (product: Product) => void }) {
  const badge = stockLabels[product.stock];
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const selectedProduct = () => ({
    ...product,
    colors: [
      ...product.colors.filter((item) => item.name === color),
      ...product.colors.filter((item) => item.name !== color)
    ]
  });

  return (
    <article className="group overflow-hidden rounded-3xl border border-black/[.04] bg-white shadow-card transition hover:-translate-y-1 hover:shadow-soft">
      <button onClick={() => onSelect(selectedProduct())} className="relative block aspect-[4/3] w-full overflow-hidden text-left">
        {product.stock !== "in-stock" && <span className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1.5 font-mono text-[9px] font-semibold uppercase ${badge.classes}`}>{badge.text}</span>}
        <ProductVisual product={product} color={color} className="h-full w-full" />
      </button>
      <div className="flex min-h-60 flex-col p-5">
        <p className="font-mono text-[9px] uppercase tracking-widest text-warm">{product.brand} · {materialLabels[product.material]}</p>
        <button className="mt-2 text-left text-lg font-semibold hover:text-warm" onClick={() => onSelect(selectedProduct())}>{product.name}</button>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{product.tagline}</p>
        {product.category === "mousepad" && product.colors.length > 0 && (
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
