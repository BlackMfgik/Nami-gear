import type { Metadata } from "next";
import { Storefront } from "@/components/storefront";
import { JsonLd } from "@/components/json-ld";
import { getLiveCatalog } from "@/lib/live-catalog";
import { productPath, SITE_DESCRIPTION, SITE_NAME, SITE_URL, TELEGRAM_URL } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", images: [{ url: "https://res.cloudinary.com/dk9yjgta3/image/upload/f_auto,q_auto/nami-gear/products/artisan-hien", alt: "Килимок Artisan Hien" }] }
};

export default async function HomePage() {
  const { products, stock, liveProducts } = await getLiveCatalog();
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "OnlineStore", name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION, logo: `${SITE_URL}/nami-logo.png`, sameAs: [TELEGRAM_URL] },
        { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE_URL, inLanguage: "uk" },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Ігрові килимки Artisan",
          itemListElement: liveProducts.map((product, index) => ({ "@type": "ListItem", position: index + 1, url: `${SITE_URL}${productPath(product.id)}`, name: `${product.brand} ${product.name}` }))
        }
      ]} />
      <Storefront initialProducts={products} initialStock={stock} />
    </>
  );
}
