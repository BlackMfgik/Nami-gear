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
import { ProductCard } from "./product-card";
import { ProductVisual } from "./product-visual";
import { SearchDialog } from "./search-dialog";

export function Storefront({ initialProducts }: { initialProducts: Product[] }) {
  const [category, setCategory] = useState<Category>("mousepad");
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroSlide, setHeroSlide] = useState(1);
  const [heroDragOffset, setHeroDragOffset] = useState(0);
  const [heroTransitionEnabled, setHeroTransitionEnabled] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [brand, setBrand] = useState("all");
  const [material, setMaterial] = useState<Material | "all">("all");
  const [type, setType] = useState<GlideType | "all">("all");
  const filterRef = useRef<HTMLDivElement>(null);
  const heroPointerStartRef = useRef<number | null>(null);
  const heroAnimatingRef = useRef(false);
  const heroSuppressClickRef = useRef(false);
  const cart = useCart();
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const { data: catalogProducts = initialProducts } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products", { cache: "no-store" });
      if (!response.ok) throw new Error("Catalog request failed");
      return response.json();
    },
    initialData: initialProducts,
    refetchInterval: 60_000,
    retry: 1
  });
  const { data: artisanStock } = useQuery<ArtisanStockResponse>({
    queryKey: ["artisan-stock"],
    queryFn: async () => { const response = await fetch("/api/artisan-stock"); if (!response.ok) throw new Error("Stock request failed"); return response.json(); },
    refetchInterval: 60_000,
    retry: 1
  });

  const products = useMemo(() => catalogProducts.map((product) => {
    const variants = artisanStock?.products[product.id]?.variants;
    if (!product.syncSource || !variants) return product;
    const livePrices = variants.map((variant) => variant.retailUAH).filter((price): price is number => typeof price === "number");
    return {
      ...product,
      price: livePrices.length ? Math.min(...livePrices) : product.price,
      stock: variants.some((variant) => variant.inStock) ? "in-stock" as const : "out-of-stock" as const
    };
  }), [artisanStock, catalogProducts]);
  const categoryProducts = useMemo(() => products.filter((product) => product.category === category), [category, products]);
  const brands = useMemo(() => [...new Set(categoryProducts.map((product) => product.brand))], [categoryProducts]);
  const materials = useMemo(() => [...new Set(categoryProducts.map((product) => product.material))], [categoryProducts]);
  const types = useMemo(() => [...new Set(categoryProducts.map((product) => product.type))], [categoryProducts]);
  const filtered = useMemo(() => categoryProducts.filter((product) => (brand === "all" || product.brand === brand) && (material === "all" || product.material === material) && (type === "all" || product.type === type)), [brand, categoryProducts, material, type]);
  const activeFilterCount = Number(brand !== "all") + Number(material !== "all") + Number(type !== "all");
  const heroProducts = useMemo(() => products.filter((product) => product.category === "mousepad").slice(0, 4), [products]);
  const heroSlides = useMemo(() => heroProducts.length ? [heroProducts.at(-1)!, ...heroProducts, heroProducts[0]] : [], [heroProducts]);

  const moveHero = useCallback((direction: -1 | 1) => {
    if (heroProducts.length < 2 || heroAnimatingRef.current) return;
    heroAnimatingRef.current = true;
    setHeroTransitionEnabled(true);
    setHeroDragOffset(0);
    setHeroSlide((slide) => slide + direction);
    setHeroIndex((index) => (index + direction + heroProducts.length) % heroProducts.length);
  }, [heroProducts.length]);

  const selectHero = useCallback((index: number) => {
    if (index === heroIndex || heroAnimatingRef.current) return;
    heroAnimatingRef.current = true;
    setHeroTransitionEnabled(true);
    setHeroDragOffset(0);
    setHeroIndex(index);
    setHeroSlide(index + 1);
  }, [heroIndex]);

  const selectCategory = useCallback((next: Category, scroll = true) => {
    setCategory(next); setBrand("all"); setMaterial("all"); setType("all"); setFiltersOpen(false);
    if (scroll) window.setTimeout(() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }), 0);
  }, []);

  useEffect(() => {
    if (heroProducts.length < 2) return;
    const timer = window.setInterval(() => moveHero(1), 6000);
    return () => window.clearInterval(timer);
  }, [heroIndex, heroProducts.length, moveHero]);
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
        <section className="relative mx-3 -mt-[52px] min-h-[600px] overflow-hidden rounded-[28px] bg-sand lg:min-h-[calc(100vh-24px)]" aria-label="Популярні товари" aria-roledescription="carousel">
          <div
            className={`flex touch-pan-y select-none ${heroTransitionEnabled ? "transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]" : ""}`}
            style={{ transform: `translate3d(calc(-${heroSlide * 100}% + ${heroDragOffset}px), 0, 0)` }}
            onPointerDown={(event) => {
              if (heroAnimatingRef.current || heroProducts.length < 2) return;
              heroPointerStartRef.current = event.clientX;
              heroSuppressClickRef.current = false;
              setHeroTransitionEnabled(false);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (heroPointerStartRef.current === null) return;
              const offset = event.clientX - heroPointerStartRef.current;
              heroSuppressClickRef.current = Math.abs(offset) > 10;
              setHeroDragOffset(offset);
            }}
            onPointerUp={(event) => {
              if (heroPointerStartRef.current === null) return;
              const offset = event.clientX - heroPointerStartRef.current;
              heroPointerStartRef.current = null;
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
              if (Math.abs(offset) >= 50) moveHero(offset < 0 ? 1 : -1);
              else {
                setHeroTransitionEnabled(true);
                setHeroDragOffset(0);
              }
            }}
            onPointerCancel={() => {
              heroPointerStartRef.current = null;
              setHeroTransitionEnabled(true);
              setHeroDragOffset(0);
            }}
            onClickCapture={(event) => {
              if (!heroSuppressClickRef.current) return;
              event.preventDefault();
              event.stopPropagation();
              heroSuppressClickRef.current = false;
            }}
            onTransitionEnd={(event) => {
              if (event.target !== event.currentTarget) return;
              heroAnimatingRef.current = false;
              if (heroSlide === 0) {
                setHeroTransitionEnabled(false);
                setHeroSlide(heroProducts.length);
              } else if (heroSlide === heroProducts.length + 1) {
                setHeroTransitionEnabled(false);
                setHeroSlide(1);
              }
            }}
          >
            {heroSlides.map((product, slideIndex) => {
              const isClone = slideIndex === 0 || slideIndex === heroSlides.length - 1;
              return (
                <div key={`${product.id}-${slideIndex}`} className="min-w-full" aria-hidden={isClone || undefined}>
                  <div className="mx-auto grid min-h-[600px] max-w-7xl items-center gap-8 px-6 pb-16 pt-32 lg:min-h-[calc(100vh-24px)] lg:grid-cols-2 lg:px-12 lg:pb-16 lg:pt-28">
                    <div className="max-w-xl"><p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-warm">★ {product.series}</p><h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-6xl">{product.name}</h1><p className="mt-5 max-w-lg text-base leading-7 text-muted">{product.tagline}</p><p className="mt-6 font-display text-xl font-bold">від {formatUAH(product.price)}</p><div className="mt-7 flex flex-wrap gap-3"><button tabIndex={isClone ? -1 : undefined} className="btn-primary" onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}>Переглянути каталог</button><button tabIndex={isClone ? -1 : undefined} className="btn-secondary" onClick={() => setSelected(product)}>Швидкий перегляд</button></div></div>
                    <ProductVisual product={product} className="aspect-square rounded-3xl" />
                  </div>
                </div>
              );
            })}
          </div>
          {heroProducts.length > 1 && <>
            <button onClick={() => moveHero(-1)} className="icon-button absolute left-5 top-1/2 hidden -translate-y-1/2 border border-line bg-white/90 lg:grid" aria-label="Попередній товар"><ChevronLeft className="size-5" /></button>
            <button onClick={() => moveHero(1)} className="icon-button absolute right-5 top-1/2 hidden -translate-y-1/2 border border-line bg-white/90 lg:grid" aria-label="Наступний товар"><ChevronRight className="size-5" /></button>
            <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-2">
              {heroProducts.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => selectHero(index)}
                  aria-label={`Слайд ${index + 1}`}
                  aria-current={index === heroIndex ? "true" : undefined}
                  className={`relative h-1 overflow-hidden rounded-full bg-black/15 transition-all ${index === heroIndex ? "w-8" : "w-5"}`}
                >
                  {index === heroIndex && <span key={heroIndex} className="hero-progress absolute inset-0 bg-ink" />}
                </button>
              ))}
            </div>
          </>}
        </section>

        <section id="catalog" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex items-end justify-between gap-4"><div><h2 className="font-display text-3xl font-bold tracking-tight">{category === "mousepad" ? "Килимки" : "Глайди"}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{category === "mousepad" ? "Тканинні та скляні поверхні для різних стилів наведення." : "Точки Meow Gaming Gear для тканинних і скляних килимків."}</p></div><div className="flex gap-2 sm:hidden"><button className="icon-button border border-line" onClick={() => setSearchOpen(true)} aria-label="Пошук"><Search className="size-4" /></button></div></div>
          <div className="relative mt-6 flex justify-end" ref={filterRef}><button onClick={() => setFiltersOpen((value) => !value)} className="btn-secondary min-h-10 px-4 normal-case" aria-expanded={filtersOpen}><Filter className="size-4" />Фільтри{activeFilterCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-ink font-mono text-[9px] text-white">{activeFilterCount}</span>}<ChevronDown className={`size-4 transition ${filtersOpen ? "rotate-180" : ""}`} /></button>{filtersOpen && <FilterPanel brands={brands} materials={materials} types={types} values={{ brand, material, type }} onBrand={setBrand} onMaterial={setMaterial} onType={setType} onReset={() => { setBrand("all"); setMaterial("all"); setType("all"); }} />}</div>
          {filtered.length ? <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} onSelect={setSelected} />)}</div> : <div className="mt-6 rounded-3xl border border-dashed border-line bg-sand p-14 text-center"><SlidersHorizontal className="mx-auto size-6 text-muted" /><h3 className="mt-4 font-display text-lg font-semibold">Товарів не знайдено</h3><button className="btn-secondary mt-5" onClick={() => { setBrand("all"); setMaterial("all"); setType("all"); }}>Скинути фільтри</button></div>}
        </section>
      </main>

      <footer className="border-t border-line"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-xs text-muted sm:flex-row sm:items-center sm:justify-between"><p className="font-mono">© 2026 Nami Gear</p><div className="flex flex-wrap gap-5"><a className="hover:text-ink" href="mailto:lanovui0902@gmail.com">lanovui0902@gmail.com</a><a className="hover:text-ink" href="https://t.me/A0klgahara" target="_blank" rel="noreferrer">Telegram: @A0klgahara</a></div></div></footer>
      <SearchDialog open={searchOpen} products={products} onClose={() => setSearchOpen(false)} onSelect={setSelected} />
      <ProductModal product={selected} variants={selected ? artisanStock?.products[selected.id]?.variants : undefined} onClose={() => setSelected(null)} />
    </>
  );
}

function FilterPanel({ brands, materials, types, values, onBrand, onMaterial, onType, onReset }: { brands: string[]; materials: Material[]; types: GlideType[]; values: { brand: string; material: Material | "all"; type: GlideType | "all" }; onBrand: (value: string) => void; onMaterial: (value: Material | "all") => void; onType: (value: GlideType | "all") => void; onReset: () => void }) {
  return <div className="absolute right-0 top-12 z-30 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-line bg-white p-4 shadow-2xl"><label className="block"><span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-muted">Компанія</span><select className="field" value={values.brand} onChange={(event) => onBrand(event.target.value)}><option value="all">Усі компанії</option>{brands.map((item) => <option key={item}>{item}</option>)}</select></label><label className="mt-4 block"><span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-muted">Матеріал</span><select className="field" value={values.material} onChange={(event) => onMaterial(event.target.value as Material | "all")}><option value="all">Усі матеріали</option>{materials.map((item) => <option key={item} value={item}>{materialLabels[item]}</option>)}</select></label><label className="mt-4 block"><span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-muted">Тип</span><select className="field" value={values.type} onChange={(event) => onType(event.target.value as GlideType | "all")}><option value="all">Усі типи</option>{types.map((item) => <option key={item} value={item}>{typeLabels[item]}</option>)}</select></label><button onClick={onReset} className="btn-secondary mt-4 w-full">Скинути фільтри</button></div>;
}
