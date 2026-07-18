"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductVisual } from "./product-visual";
import { formatUAH } from "@/lib/catalog";

export function SearchDialog({ open, products, onClose, onSelect }: { open: boolean; products: Product[]; onClose: () => void; onSelect: (product: Product) => void }) {
  if (!open) return null;

  return <SearchDialogContent products={products} onClose={onClose} onSelect={onSelect} />;
}

function SearchDialogContent({ products, onClose, onSelect }: { products: Product[]; onClose: () => void; onSelect: (product: Product) => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => { window.clearTimeout(timer); document.removeEventListener("keydown", onKey); };
  }, [onClose]);
  const results = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("uk-UA");
    if (!value) return products.slice(0, 6);
    return products.filter((product) => `${product.name} ${product.brand} ${product.series} ${product.tagline}`.toLocaleLowerCase("uk-UA").includes(value));
  }, [products, query]);
  return (
    <div className="fixed inset-0 z-[80] bg-black/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="mx-auto mt-[8vh] max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line p-4 sm:p-5">
          <Search className="size-5 text-muted" />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-base outline-none" placeholder="Знайти килимок або глайди…" aria-label="Пошук товарів" />
          <button className="icon-button shrink-0" onClick={onClose} aria-label="Закрити пошук"><X className="size-5" /></button>
        </div>
        <div className="max-h-[64vh] overflow-y-auto p-3 sm:p-4">
          {results.length ? results.map((product) => (
            <button key={product.id} onClick={() => { onSelect(product); onClose(); }} className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-sand">
              <ProductVisual product={product} className="size-16 shrink-0 rounded-xl" />
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{product.name}</span><span className="block text-xs text-muted">{product.brand} · {product.series}</span></span>
              <span className="font-display text-sm font-bold">{formatUAH(product.price)}</span>
            </button>
          )) : <div className="p-10 text-center text-sm text-muted">Нічого не знайдено. Спробуйте іншу назву або бренд.</div>}
        </div>
      </div>
    </div>
  );
}
