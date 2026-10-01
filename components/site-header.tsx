"use client";

import { Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useCart } from "@/store/cart";
import { CartDrawer } from "./cart-drawer";

export function SiteHeader({ onSearch }: { onSearch?: () => void }) {
  const pathname = usePathname();
  const cart = useCart();
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const onHome = pathname === "/";
  const scrollTop = (event: MouseEvent) => {
    if (!onHome) return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const scrollToCatalog = (event: MouseEvent) => {
    if (!onHome) return;
    event.preventDefault();
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="isolate sticky top-3 z-50 mx-auto flex h-16 w-[calc(100%-24px)] max-w-7xl items-center rounded-full border border-line bg-white/90 px-4 backdrop-blur-xl sm:px-5">
      <Link href="/" onClick={scrollTop} className="relative z-10 flex h-10 items-center" aria-label="Nami Gear, на головну">
        <Image src="/nami-logo.png" alt="Nami" width={1304} height={384} priority className="h-8 w-auto" />
      </Link>
      <nav className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-1" aria-label="Категорії">
        <Link href="/#catalog" onClick={scrollToCatalog} className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white transition sm:px-5 sm:text-sm">Килимки</Link>
      </nav>
      <div className="relative z-10 ml-auto flex items-center">
        {onSearch && <button className="icon-button hidden sm:grid" onClick={onSearch} aria-label="Пошук"><Search className="size-5" /></button>}
        <button data-cart-toggle className="icon-button focus:ring-0 focus:ring-offset-0 active:ring-2 active:ring-ink active:ring-offset-2" onClick={cart.toggle} aria-label="Відкрити кошик" aria-expanded={cart.isOpen}><ShoppingBag className="size-5" />{itemCount > 0 && <span className="absolute right-0 top-0 grid size-5 place-items-center rounded-full bg-ink font-mono text-[9px] text-white">{itemCount}</span>}</button>
      </div>
      <CartDrawer />
    </header>
  );
}
