export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nami.wtf").replace(/\/$/, "");
export const SITE_NAME = "Nami Gear";
export const SITE_DESCRIPTION = "Оригінальні ігрові килимки Artisan з Японії: Hien, Zero, Raiden, Type-99, Key-83 та Hayate-Otsu. Доставка Новою поштою по Україні.";
export const TELEGRAM_URL = "https://t.me/A0klgahara";

export const productPath = (id: string) => `/kylymky/${id}`;
