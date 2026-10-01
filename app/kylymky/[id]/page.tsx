import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import { ProductPurchase } from "@/components/product-purchase";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ARTISAN_LEAD_TIME, formatUAH, materialLabels, sortMousepadSizes, typeLabels } from "@/lib/catalog";
import { getCatalogProducts } from "@/lib/database";
import { getLiveCatalog } from "@/lib/live-catalog";
import { faqJsonLd, productAliases, shortName, type FaqItem } from "@/lib/seo";
import { productPath, SITE_NAME, SITE_URL } from "@/lib/site";
import type { GlideType, Product } from "@/lib/types";

export const revalidate = 60;

const typeDescriptions: Record<GlideType, string> = {
  control: "Поверхня з підвищеним тертям: приціл легше зупинити точно на цілі. Добре підходить для тактичних шутерів на кшталт CS2 і Valorant та для гри з низькою чутливістю.",
  speed: "Швидка поверхня з низьким тертям: миша рушає з місця майже без зусиль. Підійде для трекінгу в Apex Legends, Overwatch чи osu! і для гри з високою чутливістю.",
  balanced: "Баланс швидкості та контролю: миша легко стартує, але не пролітає повз ціль. Універсальний вибір, якщо граєте в різні жанри."
};

const absoluteUrl = (url: string) => url.startsWith("http") ? url : `${SITE_URL}${url}`;

function productFaq(product: Product, low: number): FaqItem[] {
  const name = `Artisan ${shortName(product)}`;
  return [
    { question: `Скільки коштує ${name}?`, answer: `${name} коштує від ${formatUAH(low)}: ціна залежить від розміру та бази. Доставка з Японії вже включена в ціну.` },
    { question: `Де купити ${name} в Україні?`, answer: `В Nami Gear: оформіть замовлення на цій сторінці, оплатіть карткою, і ми привеземо оригінальний ${name} з Японії та відправимо Новою поштою.` },
    { question: `Яку базу ${name} обрати?`, answer: "XSOFT найм’якша й дає більше контролю, MID найжорсткіша й найшвидша, SOFT посередині. Якщо сумніваєтеся, беріть SOFT." },
    { question: "Скільки чекати на доставку?", answer: "Зазвичай 2–4 тижні з моменту оплати, після відправки надсилаємо номер ТТН Нової пошти." }
  ];
}

async function findProduct(id: string) {
  const catalog = await getLiveCatalog();
  const product = catalog.liveProducts.find((item) => item.id === id);
  return product ? { ...catalog, product } : null;
}

function priceRange(product: Product, variants: { retailUAH: number | null }[] | undefined) {
  const prices = (variants ?? []).map((variant) => variant.retailUAH).filter((price): price is number => typeof price === "number");
  return prices.length ? { low: Math.min(...prices), high: Math.max(...prices) } : { low: product.price, high: product.price };
}

export async function generateStaticParams() {
  return (await getCatalogProducts()).map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const found = await findProduct(id);
  if (!found) return {};
  const { product } = found;
  const title = `${product.brand} ${shortName(product)}: купити килимок для миші в Україні`;
  const description = `Купити килимок (коврик) ${product.brand} ${shortName(product)} в Україні. ${product.tagline} Розміри ${sortMousepadSizes(product.sizes).join(", ")}, ціна від ${formatUAH(product.price)}.`;
  return {
    title,
    description,
    alternates: { canonical: productPath(product.id) },
    openGraph: { title, description, url: productPath(product.id), images: [{ url: absoluteUrl(product.image), alt: `${product.brand} ${product.name}` }] }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await findProduct(id);
  if (!found) notFound();
  const { product, stock, liveProducts } = found;
  const variants = stock?.products[product.id]?.variants;
  const { low, high } = priceRange(product, variants);
  const available = product.stock !== "out-of-stock";
  const url = `${SITE_URL}${productPath(product.id)}`;
  const images = [...new Set([product.image, ...product.colors.map((color) => color.image).filter((image): image is string => Boolean(image)), ...product.gallery])].map(absoluteUrl);
  const others = liveProducts.filter((item) => item.id !== product.id);
  const faq = productFaq(product, low);

  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${product.brand} ${product.name}`,
          description: product.tagline,
          image: images,
          brand: { "@type": "Brand", name: product.brand },
          category: "Ігрові килимки для миші",
          url,
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "UAH",
            lowPrice: low,
            highPrice: high,
            offerCount: variants?.filter((variant) => variant.inStock).length || 1,
            availability: !available ? "https://schema.org/OutOfStock" : product.syncSource === "artisan" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
            seller: { "@type": "Organization", name: SITE_NAME }
          }
        },
        faqJsonLd(faq),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Головна", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Килимки", item: `${SITE_URL}/#catalog` },
            { "@type": "ListItem", position: 3, name: `${product.brand} ${product.name}`, item: url }
          ]
        }
      ]} />
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">
        <nav aria-label="Навігація" className="font-mono text-[11px] text-muted">
          <Link href="/" className="hover:text-ink">Головна</Link> / <Link href="/#catalog" className="hover:text-ink">Килимки</Link> / <span className="text-ink">{product.name}</span>
        </nav>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div className="lg:col-start-1">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-warm">{product.brand} · {product.series}</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Килимок {product.brand} {product.name}</h1>
            <p className="mt-4 text-base leading-7 text-muted">{product.tagline}</p>
            <p className="mt-2 text-xs text-muted">Інші назви: {productAliases(product).join(", ")}</p>
            <p className="mt-5 font-display text-2xl font-bold">{low === high ? formatUAH(low) : `від ${formatUAH(low)}`}</p>
            <p className={`mt-2 inline-block rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold uppercase ${available ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-800"}`}>
              {available ? (product.syncSource === "artisan" ? ARTISAN_LEAD_TIME : "В наявності") : "Немає в наявності"}
            </p>
          </div>
          <div className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
            <ProductPurchase product={product} initialStock={stock} />
          </div>
          <div className="lg:col-start-1">
            <section>
              <h2 className="font-display text-xl font-semibold">Характеристики</h2>
              <dl className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white text-sm">
                {[
                  ["Бренд", product.brand],
                  ["Серія", product.series],
                  ["Поверхня", `${materialLabels[product.material]}, ${typeLabels[product.type].toLowerCase()}`],
                  ["База", product.bases.join(", ")],
                  ["Розміри", sortMousepadSizes(product.sizes).join(", ")],
                  ["Кольори", product.colors.map((color) => color.name).join(", ")],
                  ["Виробництво", product.origin]
                ].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-6 px-4 py-3"><dt className="text-muted">{label}</dt><dd className="text-right font-medium">{value}</dd></div>
                ))}
              </dl>
            </section>

            <section className="mt-10 space-y-3 text-sm leading-6 text-muted">
              <h2 className="font-display text-xl font-semibold text-ink">Для кого цей килимок</h2>
              <p>{typeDescriptions[product.type]}</p>
              <p>База визначає жорсткість піни під тканиною. XSOFT найм’якша: миша сильніше продавлює поверхню, і зупинятися легше. MID найжорсткіша, з рівнішим і швидшим ковзанням. SOFT посередині.</p>
            </section>

            <section className="mt-10 space-y-3 text-sm leading-6 text-muted">
              <h2 className="font-display text-xl font-semibold text-ink">Доставка та оплата</h2>
              <p>Килимки Artisan привозимо з Японії під замовлення, зазвичай за 2–4 тижні. Оплата повна, на банку Monobank: карткою будь-якого банку, Apple Pay або Google Pay.</p>
              <p>Доставка Новою поштою по всій Україні, від 1 000 ₴ безкоштовно. Після відправлення надсилаємо номер ТТН.</p>
            </section>
          </div>
        </div>

        <div className="mt-16 max-w-3xl">
          <Faq items={faq} />
        </div>

        {others.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold">Інші килимки</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((item) => (
                <li key={item.id}>
                  <Link href={productPath(item.id)} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm transition hover:border-ink">
                    <span className="font-medium">{item.brand} {item.name}</span>
                    <span className="shrink-0 font-display font-bold">{formatUAH(item.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
