export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nami.wtf").replace(/\/$/, "");
export const SITE_NAME = "Nami Gear";
export const SITE_DESCRIPTION = "Купити оригінальний килимок (коврик) для миші Artisan в Україні: Zero, Hien, Raiden, Type-99, Key-83, Hayate-Otsu. Ціни в гривнях, доставка Новою поштою.";
export const TELEGRAM_URL = "https://t.me/A0klgahara";

export const productPath = (id: string) => `/kylymky/${id}`;
