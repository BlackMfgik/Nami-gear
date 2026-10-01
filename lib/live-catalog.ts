import { getArtisanStock } from "./artisan";
import { applyArtisanStock } from "./catalog";
import { getCatalogProducts } from "./database";
import type { ArtisanStockResponse } from "./types";

export async function getLiveCatalog() {
  const products = await getCatalogProducts();
  let stock: ArtisanStockResponse | undefined;
  try {
    stock = await getArtisanStock({ ids: products.filter((product) => product.syncSource === "artisan").map((product) => product.id) });
  } catch (error) {
    console.error("Stored Artisan stock is unavailable", error);
  }
  return { products, stock, liveProducts: applyArtisanStock(products, stock) };
}
