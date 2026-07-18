import type { GlideType, Material } from "./types";

export const typeLabels: Record<GlideType, string> = {
  balanced: "Баланс",
  control: "Контроль",
  speed: "Швидкість",
  quiet: "Тихі",
  durable: "Зносостійкі"
};

export const materialLabels: Record<Material, string> = {
  cloth: "Тканинний килимок",
  glass: "Скляний килимок",
  dots: "Точки-глайди"
};

export const formatUAH = (price: number) => `₴${Math.round(price).toLocaleString("uk-UA")}`;

