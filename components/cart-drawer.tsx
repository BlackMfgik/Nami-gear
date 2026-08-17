"use client";

import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/store/cart";
import { formatUAH } from "@/lib/catalog";
import { amountUntilFreeShippingUAH, qualifiesForFreeShipping } from "@/lib/shipping";
import { ProductVisual } from "./product-visual";

export function CartDrawer() {
  const { items, isOpen, close, changeQuantity, remove } = useCart();
  const panelRef = useRef<HTMLElement>(null);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShipping = qualifiesForFreeShipping(subtotal, items.length > 0);
  const untilFreeShipping = amountUntilFreeShippingUAH(subtotal);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && close();
    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target || panelRef.current?.contains(target) || target.closest("[data-cart-toggle]")) return;
      close();
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePress);
    };
  }, [close, isOpen]);

  return (
    <div
      className={`pointer-events-none absolute -right-px top-[calc(100%+8px)] z-0 h-[calc(100vh-100px)] w-[calc(100vw-24px)] max-w-[320px] overflow-hidden sm:max-w-[410px] ${isOpen ? "visible" : "invisible"}`}
      aria-hidden={!isOpen}
    >
      <aside
        ref={panelRef}
        data-open={isOpen}
        className={`cart-popover flex h-[390px] max-h-full w-full flex-col overflow-hidden rounded-[32px] border border-line bg-white/[0.97] backdrop-blur-xl ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-label="Кошик"
      >
            <div className="flex h-16 shrink-0 items-center justify-between px-5">
              <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-sand"><ShoppingBag className="size-4" /></span><div><h2 className="font-display text-base font-semibold">Ваш кошик</h2><p className="text-[11px] text-muted">{items.reduce((sum, item) => sum + item.quantity, 0)} {items.length === 1 ? "товар" : "товарів"}</p></div></div>
              <button className="icon-button size-9" onClick={close} aria-label="Закрити кошик"><X className="size-4" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {items.length ? <div className="space-y-2">{items.map((item) => {
                return (
                  <article key={item.key} className="flex gap-3 rounded-2xl p-2 transition hover:bg-sand/70">
                    <ProductVisual product={{ brand: item.brand ?? "", name: item.name, image: item.image }} className="size-16 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">{item.name}</h3>
                      <p className="mt-0.5 truncate font-mono text-[9px] uppercase text-muted">{item.base} · {item.size} · {item.color}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-full border border-line bg-white p-0.5">
                          <button className="grid size-7 place-items-center rounded-full transition hover:bg-sand" onClick={() => changeQuantity(item.key, -1)} aria-label="Зменшити кількість"><Minus className="size-3" /></button>
                          <span className="w-7 text-center font-display text-xs font-semibold">{item.quantity}</span>
                          <button className="grid size-7 place-items-center rounded-full transition hover:bg-sand" onClick={() => changeQuantity(item.key, 1)} aria-label="Збільшити кількість"><Plus className="size-3" /></button>
                        </div>
                        <div className="flex items-center gap-1"><span className="font-display text-sm font-bold">{formatUAH(item.price * item.quantity)}</span><button onClick={() => remove(item.key)} className="icon-button size-7 text-muted hover:text-red-700" aria-label="Видалити"><Trash2 className="size-3.5" /></button></div>
                      </div>
                    </div>
                  </article>
                );
              })}</div> : <div className="grid h-full place-items-center px-5 pb-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-full bg-sand"><ShoppingBag className="size-5 text-muted" /></span><h3 className="mt-4 font-display text-base font-semibold">Кошик поки порожній</h3><p className="mt-1 text-xs text-muted">Додайте килимок або глайди з каталогу.</p><button className="btn-secondary mt-5 min-h-10" onClick={close}>Перейти до товарів</button></div></div>}
            </div>
            {items.length > 0 && <div className="shrink-0 border-t border-line bg-sand/70 p-4"><div className="flex items-center justify-between"><span className="text-xs text-muted">Сума замовлення</span><strong className="font-display text-lg font-bold">{formatUAH(subtotal)}</strong></div><p className={`mb-3 mt-1 text-[11px] ${freeShipping ? "font-semibold text-green-700" : "text-muted"}`}>{freeShipping ? "Безкоштовна доставка" : `До безкоштовної доставки ще ${formatUAH(untilFreeShipping)}`}</p><Link href="/checkout" onClick={close} className="btn-primary w-full">Оформити <ArrowRight className="size-4" /></Link></div>}
      </aside>
    </div>
  );
}
