import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatUAH, sortMousepadSizes, typeLabels } from "@/lib/catalog";
import { getLiveCatalog } from "@/lib/live-catalog";
import { artisanFaq, faqJsonLd, productAliases, shortName } from "@/lib/seo";
import { productPath, SITE_URL } from "@/lib/site";

export const revalidate = 60;

const title = "Килимки Artisan: купити в Україні, ціни та порівняння";
const description = "Купити килимок (коврик) для миші Artisan в Україні: Zero, Hien, Raiden, Type-99, Key-83, Hayate-Otsu. Порівняння моделей, ціни в гривнях, доставка Новою поштою.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/artisan" },
  openGraph: { title, description, url: "/artisan" }
};

export default async function ArtisanPage() {
  const { liveProducts } = await getLiveCatalog();
  const products = liveProducts.filter((product) => product.brand === "Artisan");
  const faq = artisanFaq(products);

  return (
    <>
      <JsonLd data={[
        faqJsonLd(faq),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Головна", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Килимки Artisan", item: `${SITE_URL}/artisan` }
          ]
        }
      ]} />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
        <nav aria-label="Навігація" className="font-mono text-[11px] text-muted">
          <Link href="/" className="hover:text-ink">Головна</Link> / <span className="text-ink">Килимки Artisan</span>
        </nav>

        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">Килимки Artisan: купити в Україні</h1>
        <div className="mt-5 max-w-3xl space-y-3 text-base leading-7 text-muted">
          <p>Artisan (Артісан) — японський виробник тканинних ігрових килимків для миші, які обирають кіберспортсмени в CS2, Valorant, Apex та osu!. Кожен килимок виготовляється в Японії, а модельний ряд закриває будь-який стиль гри: від максимального контролю до максимальної швидкості.</p>
          <p>У Nami Gear можна купити килимок Artisan з доставкою по Україні: ціни в гривнях, повна передоплата карткою, відправка Новою поштою. Килимки привозимо під замовлення, зазвичай за 2–4 тижні.</p>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Порівняння моделей Artisan</h2>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line font-mono text-[10px] uppercase tracking-wider text-muted">
                <tr><th className="px-4 py-3">Модель</th><th className="px-4 py-3">Тип</th><th className="px-4 py-3">Бази</th><th className="px-4 py-3">Розміри</th><th className="px-4 py-3 text-right">Ціна</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3"><Link href={productPath(product.id)} className="font-semibold hover:text-warm">Artisan {shortName(product)}</Link><span className="block text-xs text-muted">{productAliases(product)[0]}</span></td>
                    <td className="px-4 py-3">{typeLabels[product.type]}</td>
                    <td className="px-4 py-3">{product.bases.join(", ")}</td>
                    <td className="px-4 py-3">{sortMousepadSizes(product.sizes).join(", ")}</td>
                    <td className="px-4 py-3 text-right font-display font-bold">{product.stock === "out-of-stock" ? <span className="font-sans text-xs font-normal text-muted">немає</span> : `від ${formatUAH(product.price)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 space-y-4 text-sm leading-6 text-muted">
          <h2 className="font-display text-2xl font-bold text-ink">Як обрати килимок Artisan</h2>
          <h3 className="pt-2 font-display text-lg font-semibold text-ink">Контроль: Zero і Type-99</h3>
          <p>Artisan Zero та Type-99 мають вищий опір: приціл легко зупинити точно на голові. Найкращий вибір для тактичних шутерів і гри з низькою чутливістю. Zero Classic — та сама поверхня без прошитих країв і дешевше.</p>
          <h3 className="pt-2 font-display text-lg font-semibold text-ink">Баланс: Hien, Key-83 і Hayate-Otsu</h3>
          <p>Hien швидко рушає з місця завдяки шорсткій текстурі, Key-83 має шестикутне плетіння з рівним ковзанням у всіх напрямках, а Hayate-Otsu V2 — дрібнозерниста поверхня з антистатичними волокнами. Універсальні моделі для різних жанрів.</p>
          <h3 className="pt-2 font-display text-lg font-semibold text-ink">Швидкість: Raiden</h3>
          <p>Raiden — найшвидша тканинна поверхня Artisan з гладким ковзанням. Підійде для трекінгу та гри з високою чутливістю.</p>
          <h3 className="pt-2 font-display text-lg font-semibold text-ink">База: XSOFT, SOFT чи MID</h3>
          <p>База визначає жорсткість. XSOFT найм’якша й сильніше продавлюється під мишею, що додає контролю. MID найжорсткіша й найшвидша. SOFT — золота середина, з неї варто почати, якщо сумніваєтеся.</p>
        </section>

        <div className="mt-12">
          <Faq items={faq} />
        </div>

        <div className="mt-12 rounded-3xl bg-sand p-6 text-center sm:p-8">
          <p className="font-display text-xl font-bold">Готові обрати свій Artisan?</p>
          <Link href="/#catalog" className="btn-primary mt-5">Перейти до каталогу</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
