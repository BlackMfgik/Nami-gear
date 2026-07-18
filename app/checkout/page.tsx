"use client";

import { ArrowLeft, Check, Lock, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { formatUAH } from "@/lib/catalog";
import { useCart } from "@/store/cart";
import { ProductVisual } from "@/components/product-visual";

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const [complete, setComplete] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = items.length ? 80 : 0;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length) return;
    setComplete(true);
    clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (complete) return <main className="grid min-h-screen place-items-center bg-sand p-5"><div className="max-w-lg rounded-3xl bg-white p-10 text-center shadow-soft"><span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-green-800"><Check className="size-7" /></span><h1 className="mt-5 font-display text-3xl font-bold">Замовлення прийнято</h1><p className="mt-3 text-sm leading-6 text-muted">Дякуємо! Це демонстраційне оформлення: дані не відправлялися в платіжну систему.</p><Link className="btn-primary mt-7" href="/">Повернутися до магазину</Link></div></main>;

  return (
    <main className="min-h-screen bg-sand py-5 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" />До магазину</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <form onSubmit={submit} className="space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-card sm:p-7"><h1 className="font-display text-2xl font-bold">Оформлення замовлення</h1><p className="mt-2 text-sm text-muted">Заповніть контактні дані для доставки.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Ім’я" name="firstName" autoComplete="given-name" required /><Field label="Прізвище" name="lastName" autoComplete="family-name" required /><Field label="Телефон" name="phone" type="tel" autoComplete="tel" required /><Field label="Email" name="email" type="email" autoComplete="email" required /></div></section>
            <section className="rounded-3xl bg-white p-5 shadow-card sm:p-7"><h2 className="font-display text-lg font-semibold">Доставка</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Місто" name="city" autoComplete="address-level2" required /><Field label="Відділення Нової пошти" name="warehouse" required /></div><label className="mt-4 block"><span className="mb-2 block text-xs font-semibold text-muted">Коментар</span><textarea name="comment" className="field min-h-24 resize-y py-3" placeholder="Необов’язково" /></label></section>
            <section className="rounded-3xl bg-white p-5 shadow-card sm:p-7"><h2 className="font-display text-lg font-semibold">Оплата</h2><label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-ink p-4"><input type="radio" name="payment" defaultChecked className="accent-ink" /><span><strong className="block text-sm">Оплата при отриманні</strong><span className="text-xs text-muted">Після перевірки посилки</span></span></label></section>
            <button className="btn-primary w-full" disabled={!items.length}>Підтвердити замовлення</button><p className="flex items-center justify-center gap-2 font-mono text-[10px] text-muted"><Lock className="size-3" />Дані захищені та не зберігаються у цій демоверсії</p>
          </form>
          <aside className="h-fit rounded-3xl bg-white p-5 shadow-card lg:sticky lg:top-6 sm:p-6"><h2 className="font-display text-lg font-semibold">Ваше замовлення</h2>{items.length ? <div className="mt-5 space-y-4">{items.map((item) => <div key={item.key} className="flex gap-3"><ProductVisual product={{ brand: item.brand ?? "", name: item.name, image: item.image }} className="size-16 shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p><p className="mt-1 font-mono text-[9px] uppercase text-muted">{item.size} · {item.color} · ×{item.quantity}</p></div><span className="font-display text-xs font-bold">{formatUAH(item.price * item.quantity)}</span></div>)}</div> : <div className="py-12 text-center"><ShoppingBag className="mx-auto size-7 text-muted" /><p className="mt-3 text-sm text-muted">Кошик порожній</p></div>}<div className="mt-6 space-y-3 border-t border-line pt-5 text-sm"><div className="flex justify-between text-muted"><span>Товари</span><span>{formatUAH(subtotal)}</span></div><div className="flex justify-between text-muted"><span>Доставка</span><span>{formatUAH(shipping)}</span></div><div className="flex justify-between border-t border-line pt-3 font-display text-lg font-bold"><span>Разом</span><span>{formatUAH(subtotal + shipping)}</span></div></div></aside>
        </div>
      </div>
    </main>
  );
}

function Field({ label, name, type = "text", autoComplete, required }: { label: string; name: string; type?: string; autoComplete?: string; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold text-muted">{label}</span><input className="field" name={name} type={type} autoComplete={autoComplete} required={required} /></label>;
}
