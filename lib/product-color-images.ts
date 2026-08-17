import type { Product, ProductColor } from "./types";

const colorImages: Record<string, Record<string, string>> = {
  hien: {
    BLACK: "/products/colors/hien-black.jpg",
    "WINE RED": "/products/colors/hien-wine-red.jpg",
    "NAVY BLUE": "/products/colors/hien-navy-blue.jpg"
  },
  zero: {
    BLACK: "/products/colors/zero-black.jpg",
    "DAIDAI ORANGE": "/products/colors/zero-daidai-orange.jpg",
    "BOARDZY ZEBRA": "/products/colors/zero-boardzy-zebra.jpg",
    "2000FUN YAKO": "/products/colors/zero-2000fun-yako.webp"
  },
  raiden: {
    "COFFEE BROWN": "/products/colors/raiden-coffee-brown.jpg",
    "DAIDAI ORANGE": "/products/colors/raiden-daidai-orange.jpg"
  },
  "hayate-otsu-v2": {
    BLACK: "/products/colors/hayate-otsu-v2-black.jpg",
    "WINE RED": "/products/colors/hayate-otsu-v2-wine-red.jpg"
  },
  "type-99": {
    BLACK: "/products/colors/type99-black.jpg",
    MATCHA: "/products/colors/type99-matcha.jpg",
    GRAY: "/products/colors/type99-gray.jpg"
  },
  "key-83": {
    BLACK: "/products/colors/key83-black.jpg",
    PURPLE: "/products/colors/key83-purple.jpg",
    "SNOW WHITE": "/products/colors/key83-snow-white.webp"
  }
};

const normalizeColor = (value: string) => value.trim().replace(/\s+/g, " ").toUpperCase();

export function getProductColorImage(product: Pick<Product, "id" | "image" | "colors">, colorName?: string) {
  const selectedColor = colorName ?? product.colors[0]?.name;
  if (!selectedColor) return product.image;
  const color = product.colors.find((item) => normalizeColor(item.name) === normalizeColor(selectedColor));
  return color?.image ?? colorImages[product.id]?.[normalizeColor(selectedColor)] ?? product.image;
}

export function attachProductColorImages(productId: string, colors: ProductColor[]) {
  return colors.map((color) => ({
    ...color,
    image: color.image ?? colorImages[productId]?.[normalizeColor(color.name)]
  }));
}
