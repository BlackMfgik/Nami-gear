import type { ArtisanStockResponse, ArtisanVariant } from "./types";
import { ensureSchema, getSql } from "./db";

const sources: Record<string, string> = {
  hien: "https://artisan-jp.com/global/products/fx-hien",
  zero: "https://artisan-jp.com/global/products/ninja-fx/fx-zero",
  raiden: "https://artisan-jp.com/global/products/fx-raiden",
  "hayate-otsu-v2": "https://artisan-jp.com/global/products/fx-hayate-otsu-v2",
  "type-99": "https://artisan-jp.com/global/products/ninja-fx/fx-type99",
  "key-83": "https://artisan-jp.com/global/products/ninja-fx/fx-key83",
  "zero-tenz": "https://artisan-jp.com/global/products/ninja-fx-series/ninja-fx-zero-tenz-red",
  "classic-zero": "https://artisan-jp.com/global/products/classic-series/classic-zero",
  "classic-raiden": "https://artisan-jp.com/global/products/classic-series/classic-raiden"
};

export const artisanProductIds = Object.keys(sources);

export const STOREFRONT_MAX_AGE_MS = 10 * 60_000;
export const ORDER_MAX_AGE_MS = 5 * 60_000;

const FALLBACK_JPY_TO_UAH = 0.3;
const SHIPPING_PER_PAD_UAH = 750;
const PAYMENT_BUFFER = 1.03;
const TARGET_GROSS_MARGIN = 0.25;
const FETCH_CONCURRENCY = 3;

type JsonConfig = {
  attributes?: Record<string, { id: string; code: string; options?: { id: string; label: string }[] }>;
  salable?: unknown;
  index?: Record<string, Record<string, string>>;
  sku?: Record<string, string>;
  optionPrices?: Record<string, { finalPrice?: { amount?: number } }>;
};

type ParsedProduct = { inStock: boolean; variants: ArtisanVariant[] };

type StockRow = {
  product_id: string;
  source_url: string;
  in_stock: boolean;
  variants: ArtisanVariant[];
  jpy_to_uah: string;
  synced_at: string | Date;
  checked_at: string | Date;
  last_error: string | null;
};

function balancedObject(source: string, start: number) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === "\"") inString = false;
      continue;
    }
    if (char === "\"") inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error("Artisan jsonConfig is incomplete");
}

function collectSalable(value: unknown, result = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((id) => result.add(String(id)));
  else if (value && typeof value === "object") Object.values(value).forEach((child) => collectSalable(child, result));
  return result;
}

function parseVariants(config: JsonConfig): ArtisanVariant[] {
  const attributes = Object.values(config.attributes ?? {});
  const byCode = Object.fromEntries(attributes.map((attribute) => [attribute.code, attribute]));
  const salable = collectSalable(config.salable);
  const label = (productId: string, code: string) => {
    const attribute = byCode[code];
    const optionId = attribute && config.index?.[productId]?.[attribute.id];
    return String(attribute?.options?.find((option) => String(option.id) === String(optionId))?.label ?? "").trim();
  };
  return Object.keys(config.index ?? {}).map((productId) => ({
    productId,
    sku: config.sku?.[productId] ?? null,
    base: label(productId, "base_type"),
    size: label(productId, "size"),
    color: label(productId, "color"),
    priceJPY: config.optionPrices?.[productId]?.finalPrice?.amount ?? null,
    retailUAH: null,
    inStock: salable.has(productId)
  })).filter((variant) => variant.base && variant.size && variant.color);
}

export function parseArtisanPage(html: string): ParsedProduct {
  const marker = html.indexOf("\"jsonConfig\"");
  if (marker >= 0) {
    const config = JSON.parse(balancedObject(html, html.indexOf("{", marker))) as JsonConfig;
    const variants = parseVariants(config);
    if (!variants.length) throw new Error("Artisan jsonConfig has no variants");
    return { inStock: variants.some((variant) => variant.inStock), variants };
  }
  // Fully sold-out products have no jsonConfig, only this block.
  if (/class="stock unavailable"/.test(html)) return { inStock: false, variants: [] };
  throw new Error("Artisan page has neither variants nor an out-of-stock marker");
}

function recommendedRetailUAH(priceJPY: number | null, jpyToUAH: number) {
  if (priceJPY === null) return null;
  const landedCost = priceJPY * jpyToUAH * PAYMENT_BUFFER + SHIPPING_PER_PAD_UAH;
  const targetPrice = landedCost / (1 - TARGET_GROSS_MARGIN);
  const endingInNinety = Math.ceil(targetPrice / 100) * 100 - 10;
  return endingInNinety < targetPrice ? endingInNinety + 100 : endingInNinety;
}

async function getJPYRate() {
  try {
    const response = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=JPY&json", {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) throw new Error(`NBU HTTP ${response.status}`);
    const data = await response.json() as { rate?: number }[];
    const rate = data[0]?.rate;
    return typeof rate === "number" && rate > 0 ? rate : FALLBACK_JPY_TO_UAH;
  } catch {
    return FALLBACK_JPY_TO_UAH;
  }
}

async function fetchArtisanPage(sourceUrl: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(sourceUrl, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; NamiGearStockMonitor/3.0)", accept: "text/html" },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000)
      });
      if (!response.ok) throw new Error(`Artisan HTTP ${response.status}`);
      return parseArtisanPage(await response.text());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function mapWithConcurrency<T, R>(values: T[], limit: number, task: (value: T) => Promise<R>) {
  const results: R[] = new Array(values.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (next < values.length) {
      const index = next++;
      results[index] = await task(values[index]);
    }
  }));
  return results;
}

export async function syncArtisanStock(ids: string[] = artisanProductIds) {
  const known = ids.filter((id) => id in sources);
  if (!known.length) return { synced: [] as string[], failed: [] as string[] };
  await ensureSchema();
  const sql = getSql();
  // Claim rows so concurrent requests don't scrape the same page twice.
  const existing = await sql`SELECT product_id FROM artisan_stock WHERE product_id = ANY(${known})` as { product_id: string }[];
  const claimed = await sql`
    UPDATE artisan_stock SET checked_at = now()
    WHERE product_id = ANY(${known}) AND checked_at < now() - interval '60 seconds'
    RETURNING product_id
  ` as { product_id: string }[];
  const existingIds = new Set(existing.map((row) => row.product_id));
  const toSync = [...claimed.map((row) => row.product_id), ...known.filter((id) => !existingIds.has(id))];
  if (!toSync.length) return { synced: [] as string[], failed: [] as string[] };
  const jpyToUAH = await getJPYRate();
  const results = await mapWithConcurrency(toSync, FETCH_CONCURRENCY, async (id) => {
    const sourceUrl = sources[id];
    try {
      const parsed = await fetchArtisanPage(sourceUrl);
      const variants = parsed.variants.map((variant) => ({ ...variant, retailUAH: recommendedRetailUAH(variant.priceJPY, jpyToUAH) }));
      await sql`
        INSERT INTO artisan_stock (product_id, source_url, in_stock, variants, jpy_to_uah, synced_at, checked_at, last_error)
        VALUES (${id}, ${sourceUrl}, ${parsed.inStock}, ${JSON.stringify(variants)}::jsonb, ${jpyToUAH}, now(), now(), NULL)
        ON CONFLICT (product_id) DO UPDATE SET
          source_url = EXCLUDED.source_url, in_stock = EXCLUDED.in_stock, variants = EXCLUDED.variants,
          jpy_to_uah = EXCLUDED.jpy_to_uah, synced_at = now(), checked_at = now(), last_error = NULL
      `;
      return { id, ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Artisan sync failed for ${id}`, error);
      await sql`UPDATE artisan_stock SET checked_at = now(), last_error = ${message} WHERE product_id = ${id}`;
      return { id, ok: false };
    }
  });
  return { synced: results.filter((r) => r.ok).map((r) => r.id), failed: results.filter((r) => !r.ok).map((r) => r.id) };
}

async function readStockRows(ids: string[]) {
  await ensureSchema();
  return await getSql()`SELECT * FROM artisan_stock WHERE product_id = ANY(${ids})` as StockRow[];
}

export function staleArtisanIds(rows: { product_id: string; synced_at: string | Date }[], ids: string[], maxAgeMs: number) {
  const syncedAt = new Map(rows.map((row) => [row.product_id, new Date(row.synced_at).getTime()]));
  return ids.filter((id) => Date.now() - (syncedAt.get(id) ?? 0) > maxAgeMs);
}

export async function getArtisanStock({ ids = artisanProductIds, maxAgeMs = STOREFRONT_MAX_AGE_MS, refresh = "none" }: {
  ids?: string[];
  maxAgeMs?: number;
  refresh?: "none" | "blocking";
} = {}): Promise<ArtisanStockResponse & { staleIds: string[] }> {
  const wanted = ids.filter((id) => id in sources);
  let rows = await readStockRows(wanted);
  let staleIds = staleArtisanIds(rows, wanted, maxAgeMs);
  if (refresh === "blocking" && staleIds.length) {
    await syncArtisanStock(staleIds);
    rows = await readStockRows(wanted);
    staleIds = staleArtisanIds(rows, wanted, maxAgeMs);
  }
  const time = (value: string | Date) => new Date(value).getTime();
  const latest = rows.reduce<StockRow | null>((best, row) => !best || time(row.synced_at) > time(best.synced_at) ? row : best, null);
  return {
    updatedAt: new Date(latest?.synced_at ?? 0).toISOString(),
    pricing: {
      jpyToUAH: latest ? Number(latest.jpy_to_uah) : FALLBACK_JPY_TO_UAH,
      shippingPerPadUAH: SHIPPING_PER_PAD_UAH,
      targetGrossMargin: TARGET_GROSS_MARGIN,
      source: "Artisan JPY + NBU exchange rate"
    },
    products: Object.fromEntries(rows.map((row) => [row.product_id, {
      sourceUrl: row.source_url,
      updatedAt: new Date(row.synced_at).toISOString(),
      inStock: row.in_stock,
      variants: row.variants,
      ...(row.last_error ? { error: row.last_error } : {})
    }])),
    staleIds
  };
}
