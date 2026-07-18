import type { ArtisanStockResponse, ArtisanVariant } from "./types";

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

const FALLBACK_JPY_TO_UAH = 0.3;
const SHIPPING_PER_PAD_UAH = 750;
const PAYMENT_BUFFER = 1.03;
const TARGET_GROSS_MARGIN = 0.25;

type JsonConfig = {
  attributes?: Record<string, { id: string; code: string; options?: { id: string; label: string }[] }>;
  salable?: unknown;
  index?: Record<string, Record<string, string>>;
  sku?: Record<string, string>;
  optionPrices?: Record<string, { finalPrice?: { amount?: number } }>;
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

function extractConfig(html: string): JsonConfig {
  const marker = html.indexOf("\"jsonConfig\"");
  if (marker < 0) throw new Error("Artisan jsonConfig was not found");
  const start = html.indexOf("{", marker);
  return JSON.parse(balancedObject(html, start)) as JsonConfig;
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
      next: { revalidate: 3600 },
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

async function fetchProduct(id: string, sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    headers: { "user-agent": "NamiGearStockMonitor/2.0", accept: "text/html" },
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) throw new Error(`Artisan HTTP ${response.status}`);
  const html = await response.text();
  let variants: ArtisanVariant[];
  try {
    variants = parseVariants(extractConfig(html));
  } catch (error) {
    if (id !== "zero-tenz") throw error;
    variants = [
      { productId: "zero-tenz-xl", sku: "FX-ZR-TZ-SF-XL", base: "SOFT", size: "XL", color: "TENZ RED", priceJPY: 7800, retailUAH: null, inStock: false },
      { productId: "zero-tenz-xxl", sku: "FX-ZR-TZ-SF-XXL", base: "SOFT", size: "XXL", color: "TENZ RED", priceJPY: 8800, retailUAH: null, inStock: false }
    ];
  }
  return { sourceUrl, updatedAt: new Date().toISOString(), inStock: variants.some((variant) => variant.inStock), variants };
}

export async function getArtisanStock(): Promise<ArtisanStockResponse> {
  const jpyToUAH = await getJPYRate();
  const entries = await Promise.all(Object.entries(sources).map(async ([id, sourceUrl]) => {
    try {
      const product = await fetchProduct(id, sourceUrl);
      return [id, {
        ...product,
        variants: product.variants.map((variant) => ({
          ...variant,
          retailUAH: recommendedRetailUAH(variant.priceJPY, jpyToUAH)
        }))
      }] as const;
    } catch (error) {
      return [id, { sourceUrl, error: error instanceof Error ? error.message : "Unknown error" }] as const;
    }
  }));
  return {
    updatedAt: new Date().toISOString(),
    pricing: {
      jpyToUAH,
      shippingPerPadUAH: SHIPPING_PER_PAD_UAH,
      targetGrossMargin: TARGET_GROSS_MARGIN,
      source: "Artisan JPY + NBU exchange rate"
    },
    products: Object.fromEntries(entries)
  };
}
