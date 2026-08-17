"use client";

import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ArtisanVariant, Product } from "@/lib/types";
import { formatUAH, sortMousepadSizes } from "@/lib/catalog";
import { getProductColorImage } from "@/lib/product-color-images";
import { useCart } from "@/store/cart";

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toUpperCase();
const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
const fallbackColor = (name: string) => ({
  name,
  hex: name.includes("ORANGE") ? "#e2610a" : name.includes("RED") ? "#b51f27" : name.includes("PURPLE") ? "#4d1f62" : name.includes("MATCHA") ? "#9b8c22" : name.includes("GRAY") ? "#777777" : name.includes("WHITE") ? "#f2f1ee" : name.includes("BROWN") ? "#4b2e1e" : "#171717"
});

export function ProductModal({ product, variants, onClose }: { product: Product | null; variants?: ArtisanVariant[]; onClose: () => void }) {
  if (!product) return null;

  return <ProductModalContent key={`${product.id}-${variants?.length ?? 0}`} product={product} variants={variants} onClose={onClose} />;
}

function ProductModalContent({ product, variants, onClose }: { product: Product; variants?: ArtisanVariant[]; onClose: () => void }) {
  const add = useCart((state) => state.add);
  const liveVariants = variants?.filter((variant) => variant.base && variant.size && variant.color);
  const bases = liveVariants?.length ? unique(liveVariants.map((variant) => variant.base)) : product.bases;
  const unsortedSizes = liveVariants?.length ? unique(liveVariants.map((variant) => variant.size)) : product.sizes;
  const sizes = product.category === "mousepad" ? sortMousepadSizes(unsortedSizes) : unsortedSizes;
  const colorNames = unique([...product.colors.map((item) => item.name), ...(liveVariants?.map((variant) => variant.color) ?? [])]);
  const colors = colorNames.map((name) => product.colors.find((item) => normalize(item.name) === normalize(name)) ?? fallbackColor(name));
  const preferredColor = product.colors[0]?.name;
  const firstAvailable = liveVariants?.find((variant) => variant.inStock && normalize(variant.color) === normalize(preferredColor ?? "")) ?? liveVariants?.find((variant) => variant.inStock) ?? liveVariants?.[0];
  const [base, setBase] = useState(() => firstAvailable?.base ?? product.bases.find((item) => item === "SOFT") ?? product.bases[0]);
  const [size, setSize] = useState(() => firstAvailable?.size ?? product.sizes.find((item) => item === "XL") ?? product.sizes.at(-1) ?? product.sizes[0]);
  const [color, setColor] = useState(() => preferredColor ?? firstAvailable?.color ?? "");
  const selectedColorImage = getProductColorImage(product, color);
  const galleryImages = [selectedColorImage, ...product.gallery.filter((image) => image !== selectedColorImage)];
  const imageCount = galleryImages.length;
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setActiveImage((index) => (index - 1 + imageCount) % imageCount);
      if (event.key === "ArrowRight") setActiveImage((index) => (index + 1) % imageCount);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [imageCount, onClose]);

  const selectedVariant = liveVariants?.find((variant) => normalize(variant.base) === normalize(base) && normalize(variant.size) === normalize(size) && normalize(variant.color) === normalize(color));
  const selectionAvailable = liveVariants?.length ? Boolean(selectedVariant?.inStock) : product.stock !== "out-of-stock";

  const optionAvailable = (kind: "base" | "size" | "color", value: string) => {
    if (!liveVariants?.length) return product.stock !== "out-of-stock";
    return liveVariants.some((variant) => variant.inStock && normalize(variant[kind]) === normalize(value));
  };
  const price = selectedVariant?.retailUAH ?? product.priceBySize?.[size] ?? product.price;
  const changeVariantOption = (kind: "base" | "size" | "color", value: string) => {
    if (!liveVariants?.length) {
      if (kind === "base") setBase(value);
      if (kind === "size") setSize(value);
      if (kind === "color") { setColor(value); setActiveImage(0); }
      return;
    }
    const matchingVariants = liveVariants.filter((variant) => normalize(variant[kind]) === normalize(value));
    if (kind === "color" && !matchingVariants.length) {
      setColor(value);
      setActiveImage(0);
      return;
    }
    const candidates = kind === "color" ? matchingVariants : matchingVariants.filter((variant) => variant.inStock);
    const compatible = candidates.filter((variant) => (kind === "base" || normalize(variant.base) === normalize(base)) && (kind === "size" || normalize(variant.size) === normalize(size)) && (kind === "color" || normalize(variant.color) === normalize(color)));
    const candidate = compatible.find((variant) => variant.inStock) ?? candidates.find((variant) => variant.inStock) ?? compatible[0] ?? candidates[0];
    if (!candidate) return;
    setBase(candidate.base);
    setSize(candidate.size);
    setColor(candidate.color);
    if (kind === "color") setActiveImage(0);
  };
  const changeSize = (value: string) => {
    changeVariantOption("size", value);
    if (product.category === "skates") setActiveImage(Math.max(0, product.sizes.indexOf(value)));
  };
  const addToCart = () => {
    if (!selectionAvailable) return;
    add({ key: `${product.id}__${base}__${size}__${color}`, productId: product.id, name: product.name, brand: product.brand, material: product.material, image: selectedColorImage, base, size, color, price });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[85] grid place-items-center bg-black/45 p-3 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 sm:px-6"><h2 className="font-display text-lg font-semibold">{product.name}</h2><button className="icon-button" onClick={onClose} aria-label="Закрити"><X className="size-5" /></button></div>
        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#f3f2ef]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="h-full w-full object-cover" src={galleryImages[activeImage]} alt={`${product.brand} ${product.name}, ${color}, фото ${activeImage + 1}`} />
            {imageCount > 1 && <>
              <button className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/90 shadow-sm backdrop-blur transition hover:bg-white" onClick={() => setActiveImage((index) => (index - 1 + imageCount) % imageCount)} aria-label="Попереднє фото"><ChevronLeft className="size-5" /></button>
              <button className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/90 shadow-sm backdrop-blur transition hover:bg-white" onClick={() => setActiveImage((index) => (index + 1) % imageCount)} aria-label="Наступне фото"><ChevronRight className="size-5" /></button>
              <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 font-mono text-[10px] text-white">{activeImage + 1} / {imageCount}</span>
            </>}
          </div>
          {imageCount > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Галерея товару">
              {galleryImages.map((image, index) => (
                <button key={image} onClick={() => setActiveImage(index)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#f3f2ef] transition ${activeImage === index ? "border-ink" : "border-transparent hover:border-line"}`} aria-label={`Показати фото ${index + 1}`} aria-current={activeImage === index ? "true" : undefined}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <p className="mt-4 font-mono text-[10px] font-semibold tracking-[.14em] text-warm">{product.series}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{product.tagline}</p>
          <OptionGroup label={product.category === "skates" ? "Матеріал" : "База (жорсткість)"} value={base} options={bases} current={base} available={(value) => optionAvailable("base", value)} onChange={(value) => changeVariantOption("base", value)} />
          <OptionGroup label={product.category === "skates" ? "Комплект" : "Розмір"} value={size} options={sizes} current={size} available={(value) => optionAvailable("size", value)} onChange={changeSize} />
          <div className="mt-5"><div className="mb-3 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted"><span>Колір</span><span className="text-ink">{color}</span></div><div className="flex flex-wrap gap-4">{colors.map((item) => { const enabled = optionAvailable("color", item.name); return <button key={item.name} onClick={() => changeVariantOption("color", item.name)} className={`group/color flex flex-col items-center gap-2 transition ${enabled ? "" : "opacity-45"}`} aria-label={`${item.name}${enabled ? "" : " — немає в наявності"}`} aria-disabled={!enabled} title={enabled ? item.name : `${item.name} — немає в наявності`}><span className={`grid size-9 place-items-center rounded-full border-2 ${normalize(color) === normalize(item.name) ? "border-ink" : "border-line"}`} style={{ background: item.hex }}>{normalize(color) === normalize(item.name) && <Check className="size-4 text-white mix-blend-difference" />}</span><span className="font-mono text-[9px] text-muted">{item.name}</span></button>; })}</div></div>
        </div>
        <div className="flex shrink-0 items-center gap-4 border-t border-line bg-sand p-5 sm:px-6"><div className="shrink-0"><strong className="block font-display text-xl font-bold">{formatUAH(price)}</strong><span className="font-mono text-[9px] text-muted">{product.origin}</span></div><button className="btn-primary flex-1" onClick={addToCart} disabled={!selectionAvailable}>{selectionAvailable ? "Додати в кошик" : "Немає в наявності"}</button></div>
      </div>
    </div>
  );
}

function OptionGroup({ label, value, options, current, available, onChange }: { label: string; value: string; options: string[]; current: string; available: (value: string) => boolean; onChange: (value: string) => void }) {
  return <div className="mt-5"><div className="mb-3 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted"><span>{label}</span><span className="text-ink">{value}</span></div><div className="flex flex-wrap gap-2">{options.map((option) => { const enabled = available(option); return <button key={option} disabled={!enabled} onClick={() => onChange(option)} className={`rounded-full border px-4 py-2 text-xs font-medium transition ${current === option ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"} disabled:cursor-not-allowed disabled:bg-sand disabled:text-neutral-300 disabled:line-through`}>{option}</button>; })}</div></div>;
}
