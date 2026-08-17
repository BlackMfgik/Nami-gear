export type Category = "mousepad" | "skates";
export type Material = "cloth" | "glass" | "dots";
export type GlideType = "balanced" | "control" | "speed" | "quiet" | "durable";
export type StockState = "in-stock" | "preorder" | "out-of-stock";

export type ProductColor = { name: string; hex: string; image?: string };

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  material: Material;
  type: GlideType;
  series: string;
  tagline: string;
  price: number;
  stock: StockState;
  image: string;
  gallery: string[];
  bases: string[];
  sizes: string[];
  colors: ProductColor[];
  priceBySize?: Record<string, number>;
  syncSource?: "artisan";
  origin: string;
};

export type ArtisanVariant = {
  productId: string;
  sku: string | null;
  base: string;
  size: string;
  color: string;
  priceJPY: number | null;
  retailUAH: number | null;
  inStock: boolean;
};

export type ArtisanStockResponse = {
  updatedAt: string;
  pricing: {
    jpyToUAH: number;
    shippingPerPadUAH: number;
    targetGrossMargin: number;
    source: string;
  };
  products: Record<string, {
    sourceUrl: string;
    updatedAt?: string;
    inStock?: boolean;
    variants?: ArtisanVariant[];
    error?: string;
  }>;
};

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  brand: string;
  material?: Material;
  image: string;
  base: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
};
