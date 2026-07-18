"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Search, ShoppingBag, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArtisanStockResponse, Category, GlideType, Material, Product } from "@/lib/types";
import { formatUAH, materialLabels, typeLabels } from "@/lib/catalog";
import { useCart } from "@/store/cart";
import { CartDrawer } from "./cart-drawer";
import { ProductModal } from "./product-modal";
import { ProductVisual } from "./product-visual";
import { SearchDialog } from "./search-dialog";

const stockLabels = {
  "in-stock": { text: "В наявності", classes: "bg-green-100 text-green-800" },
  preorder: { text: "Уточнюємо", classes: "bg-orange-100 text-orange-800" },
  "out-of-stock": { text: "Немає", classes: "bg-red-100 text-red-800" }
};

export function Storefront({ initialProducts }: { initialProducts: Product[] }) {
  const [category, setCategory] = useState<Category>("mousepad");
  const [heroIndex, setHeroIndex] = useState(0);
  const [selected, setSelected] = useState<Product | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [brand, setBrand] = useState("all");
  const [material, setMaterial] = useState<Material | "all">("all");
  const [type, setType] = useState<GlideType | "all">("all");
  const filterRef = useRef<HTMLDivElement>(null);
  const cart = useCart();
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const { data: artisanStock } = useQuery<ArtisanStockResponse>({
    queryKey: ["artisan-stock"],
    queryFn: async () => { const response = await fetch("/api/artisan-stock"); if (!response.ok) throw new Error("Stock request failed"); return response.json(); },
    refetchInterval: 60_000,
    retry: 1
  });

  const products = useMemo(() => initialProducts.map((product) => {
    const variants = artisanStock?.products[product.id]?.variants;
    if (!product.syncSource || !variants) return product;
    const livePrices = variants.map((variant) => variant.retailUAH).filter((price): price is number => typeof price === "number");
    return {
      ...product,
      price: livePrices.length ? Math.min(...livePrices) : product.price,
      stock: variants.some((variant) => variant.inStock) ? "in-stock" as const : "out-of-stock" as const
    };
  }), [artisanStock, initialProducts]);
  const categoryProducts = useMemo(() => products.filter((product) => product.category === category), [category, products]);
  const brands = useMemo(() => [...new Set(categoryProducts.map((product) => product.brand))], [categoryProducts]);
  const materials = useMemo(() => [...new Set(categoryProducts.map((product) => product.material))], [categoryProducts]);
  const types = useMemo(() => [...new Set(categoryProducts.map((product) => product.type))], [categoryProducts]);
  const filtered = useMemo(() => categoryProducts.filter((product) => (brand === "all" || product.brand === brand) && (material === "all" || product.material === material) && (type === "all" || product.type === type)), [brand, categoryProducts, material, type]);
  const activeFilterCount = Number(brand !== "all") + Number(material !== "all") + Number(type !== "all");
  const heroProducts = products.filter((product) => product.category === "mousepad").slice(0, 4);
  const hero = heroProducts[heroIndex % heroProducts.length];

  const selectCategory = useCallback((next: Category, scroll = true) => {
    setCategory(next); setBrand("all"); setMaterial("all"); setType("all"); setFiltersOpen(false);
    if (scroll) window.setTimeout(() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }), 0);
  }, []);

  useEffect(() => { const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroProducts.length), 6000); return () => window.clearInterval(timer); }, [heroProducts.length]);
  useEffect(() => {
    const handler = (event: MouseEvent) => { if (filtersOpen && filterRef.current && !filterRef.current.contains(event.target as Node)) setFiltersOpen(false); };
    document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler);
  }, [filtersOpen]);

  return (
    <>
      <header className="isolate sticky top-3 z-50 mx-auto flex h-16 w-[calc(100%-24px)] max-w-7xl items-center rounded-full border border-line bg-white/90 px-4 backdrop-blur-xl sm:px-5">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="relative z-10 flex h-10 items-center" aria-label="На початок сторінки">
          <Image src="/nami-logo.png" alt="Nami" width={1304} height={384} priority className="h-8 w-auto" />
        </button>
        <nav className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-1" aria-label="Категорії">
          <button onClick={() => selectCategory("mousepad")} className={`rounded-full px-3 py-2 text-xs font-semibold transition sm:px-5 sm:text-sm ${category === "mousepad" ? "bg-ink text-white" : "text-muted hover:bg-sand"}`}>Килимки</button>
          <button onClick={() => selectCategory("skates")} className={`rounded-full px-3 py-2 text-xs font-semibold transition sm:px-5 sm:text-sm ${category === "skates" ? "bg-ink text-white" : "text-muted hover:bg-sand"}`}>Глайди</button>
        </nav>
        <div className="relative z-10 ml-auto flex items-center"><button className="icon-button hidden sm:grid" onClick={() => setSearchOpen(true)} aria-label="Пошук"><Search className="size-5" /></button><button data-cart-toggle className="icon-button focus:ring-0 focus:ring-offset-0 active:ring-2 active:ring-ink active:ring-offset-2" onClick={cart.toggle} aria-label="Відкрити кошик" aria-expanded={cart.isOpen}><ShoppingBag className="size-5" />{itemCount > 0 && <span className="absolute right-0 top-0 grid size-5 place-items-center rounded-full bg-ink font-mono text-[9px] text-white">{itemCount}</span>}</button></div>
        <CartDrawer />
      </header>

      <main>
        <section className="relative mx-3 -mt-[52px] min-h-[600px] overflow-hidden rounded-[28px] bg-sand lg:min-h-[calc(100vh-24px)]" aria-label="Популярні товари">
          <div className="mx-auto grid min-h-[600px] max-w-7xl items-center gap-8 px-6 pb-16 pt-32 lg:min-h-[calc(100vh-24px)] lg:grid-cols-2 lg:px-12 lg:pb-16 lg:pt-28">
            <div className="max-w-xl"><p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-warm">★ {hero.series}</p><h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-6xl">{hero.name}</h1><p className="mt-5 max-w-lg text-base leading-7 text-muted">{hero.tagline}</p><p className="mt-6 font-display text-xl font-bold">від {formatUAH(hero.price)}</p><div className="mt-7 flex flex-wrap gap-3"><button className="btn-primary" onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}>Переглянути каталог</button><button className="btn-secondary" onClick={() => setSelected(hero)}>Швидкий перегляд</button></div></div>
            <ProductVisual product={hero} className="aspect-square rounded-3xl" />
          </div>
          <button onClick={() => setHeroIndex((heroIndex - 1 + heroProducts.length) % heroProducts.length)} className="icon-button absolute left-5 top-1/2 hidden -translate-y-1/2 border border-line bg-white/90 lg:grid" aria-label="Попередній товар"><ChevronLeft className="size-5" /></button>
          <button onClick={() => setHeroIndex((heroIndex + 1) % heroProducts.length)} className="icon-button absolute right-5 top-1/2 hidden -translate-y-1/2 border border-line bg-white/90 lg:grid" aria-label="Наступний товар"><ChevronRight className="size-5" /></button>
          <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-2">{heroProducts.map((product, index) => <button key={product.id} onClick={() => setHeroIndex(index)} aria-label={`Слайд ${index + 1}`} className={`h-1 rounded-full transition-all ${index === heroIndex ? "w-8 bg-ink" : "w-5 bg-black/15"}`} />)}</div>
        </section>

        <section id="catalog" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex items-end justify-between gap-4"><div><h2 className="font-display text-3xl font-bold tracking-tight">{category === "mousepad" ? "Килимки" : "Глайди"}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{category === "mousepad" ? "Тканинні та скляні поверхні для різних стилів наведення." : "Точки Meow Gaming Gear для тканинних і скляних килимків."}</p></div><div className="flex gap-2 sm:hidden"><button className="icon-button border border-line" onClick={() => setSearchOpen(true)} aria-label="Пошук"><Search className="size-4" /></button></div></div>
          <div className="relative mt-6 flex justify-end" ref={filterRef}><button onClick={() => setFiltersOpen((value) => !value)} className="btn-secondary min-h-10 px-4 normal-case" aria-expanded={filtersOpen}><Filter className="size-4" />Фільтри{activeFilterCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-ink font-mono text-[9px] text-white">{activeFilterCount}</span>}<ChevronDown className={`size-4 transition ${filtersOpen ? "rotate-180" : ""}`} /></button>{filtersOpen && <FilterPanel brands={brands} materials={materials} types={types} values={{ brand, material, type }} onBrand={setBrand} onMaterial={setMaterial} onType={setType} onReset={() => { setBrand("all"); setMaterial("all"); setType("all"); }} />}</div>
          {filtered.length ? <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} onSelect={setSelected} />)}</div> : <div className="mt-6 rounded-3xl border border-dashed border-line bg-sand p-14 text-center"><SlidersHorizontal className="mx-auto size-6 text-muted" /><h3 className="mt-4 font-display text-lg font-semibold">Товарів не знайдено</h3><button className="btn-secondary mt-5" onClick={() => { setBrand("all"); setMaterial("all"); setType("all"); }}>Скинути фільтри</button></div>}
        </section>
      </main>

      <footer className="border-t border-line"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-xs text-muted sm:flex-row sm:items-center sm:justify-between"><p className="font-mono">© 2026 Nami Gear</p><div className="flex gap-5"><a className="hover:text-ink" href="mailto:lanovui0902@gmail.com">Підтримка</a><a className="hover:text-ink" href="https://t.me/A0kIgahara" target="_blank" rel="noreferrer">Telegram</a></div></div></footer>
      <SearchDialog open={searchOpen} products={products} onClose={() => setSearchOpen(false)} onSelect={setSelected} />
      <ProductModal product={selected} variants={selected ? artisanStock?.products[selected.id]?.variants : undefined} onClose={() => setSelected(null)} />
    </>
  );
}

function ProductCard({ product, onSelect }: { product: Product; onSelect: (product: Product) => void }) {
  const badge = stockLabels[product.stock];
  return <article className="group overflow-hidden rounded-3xl border border-black/[.04] bg-white shadow-card transition hover:-translate-y-1 hover:shadow-soft"><button onClick={() => onSelect(product)} className="relative block aspect-[4/3] w-full overflow-hidden text-left">{product.stock !== "in-stock" && <span className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1.5 font-mono text-[9px] font-semibold uppercase ${badge.classes}`}>{badge.text}</span>}<ProductVisual product={product} className="h-full w-full" /></button><div className="flex min-h-52 flex-col p-5"><p className="font-mono text-[9px] uppercase tracking-widest text-warm">{product.brand} · {materialLabels[product.material]}</p><button className="mt-2 text-left text-lg font-semibold hover:text-warm" onClick={() => onSelect(product)}>{product.name}</button><p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{product.tagline}</p><div className="mt-auto flex items-center justify-between pt-5"><span className="font-display text-base font-bold">від {formatUAH(product.price)}</span><button className="btn-primary min-h-10 px-4" onClick={() => onSelect(product)}>Обрати</button></div></div></article>;
}

function FilterPanel({ brands, materials, types, values, onBrand, onMaterial, onType, onReset }: { brands: string[]; materials: Material[]; types: GlideType[]; values: { brand: string; material: Material | "all"; type: GlideType | "all" }; onBrand: (value: string) => void; onMaterial: (value: Material | "all") => void; onType: (value: GlideType | "all") => void; onReset: () => void }) {
  return <div className="absolute right-0 top-12 z-30 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-line bg-white p-4 shadow-2xl"><label className="block"><span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-muted">Компанія</span><select className="field" value={values.brand} onChange={(event) => onBrand(event.target.value)}><option value="all">Усі компанії</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></label><label className="mt-4 block"><span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-muted">Матеріал</span><select className="field" value={values.material} onChange={(event) => onMaterial(event.target.value as Material | "all")}><option value="all">Усі матеріали</option>{materials.map((item) => <option key={item} value={item}>{materialLabels[item]}</option>)}</select></label><label className="mt-4 block"><span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-muted">Тип</span><select className="field" value={values.type} onChange={(event) => onType(event.target.value as GlideType | "all")}><option value="all">Усі типи</option>{types.map((item) => <option key={item} value={item}>{typeLabels[item]}</option>)}</select></label><button onClick={onReset} className="btn-secondary mt-4 w-full">Скинути фільтри</button></div>;
}
