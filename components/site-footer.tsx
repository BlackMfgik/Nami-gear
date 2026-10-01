import Link from "next/link";
import { TELEGRAM_URL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-7xl px-6 pt-10 text-sm leading-6 text-muted">
        <h2 className="font-display text-lg font-bold text-ink">Купити килимок Artisan в Україні</h2>
        <p className="mt-2 max-w-3xl">Nami Gear привозить оригінальні японські килимки (коврики) для миші Artisan: Zero, Hien, Raiden, Type-99, Key-83 та Hayate-Otsu у базах XSOFT, SOFT і MID та розмірах від S до XXL. Ціни в гривнях, оплата карткою, доставка Новою поштою по всій Україні.</p>
        <p className="mt-2 max-w-3xl">Не знаєте, яку модель обрати? <Link href="/artisan" className="font-semibold text-ink underline underline-offset-4">Порівняння килимків Artisan</Link> допоможе підібрати поверхню під ваш стиль гри.</p>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-xs text-muted sm:flex-row sm:items-center sm:justify-between"><p className="font-mono">© 2026 Nami Gear · made by <a className="hover:text-ink" href="https://aokigahara.dev">Aokigahara</a></p><div className="flex flex-wrap gap-5"><Link className="hover:text-ink" href="/artisan">Килимки Artisan</Link><a className="hover:text-ink" href="mailto:lanovui0902@gmail.com">lanovui0902@gmail.com</a><a className="hover:text-ink" href={TELEGRAM_URL} target="_blank" rel="noreferrer">Telegram: @A0klgahara</a></div></div>
    </footer>
  );
}
