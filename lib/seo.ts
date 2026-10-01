import { formatUAH } from "./catalog";
import type { Product } from "./types";

export const shortName = (product: Pick<Product, "name">) => product.name.replace(/^NINJA FX\s+/i, "");

const cyrillicNames: Record<string, string> = {
  hien: "Хієн",
  zero: "Зеро",
  raiden: "Райден",
  "hayate-otsu-v2": "Хаяте Оцу",
  "type-99": "Тайп 99",
  "key-83": "Кей 83",
  "zero-tenz": "Зеро ТенЗ",
  "classic-zero": "Зеро Класік",
  "classic-raiden": "Райден Класік"
};

export function productAliases(product: Product) {
  const short = shortName(product);
  const cyrillic = cyrillicNames[product.id];
  return [cyrillic && `Артісан ${cyrillic}`, `Artisan ${short}`, product.series === "NINJA FX" && `Artisan Ninja FX ${short}`].filter((value): value is string => Boolean(value));
}

export type FaqItem = { question: string; answer: string };

export function artisanFaq(products: Product[]): FaqItem[] {
  const available = products.filter((product) => product.stock !== "out-of-stock");
  const minPrice = Math.min(...(available.length ? available : products).map((product) => product.price));
  return [
    {
      question: "Де купити оригінальний килимок Artisan в Україні?",
      answer: "У Nami Gear: привозимо оригінальні килимки Artisan, виготовлені в Японії, під замовлення та відправляємо Новою поштою по всій Україні."
    },
    {
      question: "Скільки коштує килимок Artisan?",
      answer: `Від ${formatUAH(minPrice)} залежно від моделі та розміру. Ціна на сайті розраховується за актуальним курсом і вже включає доставку з Японії.`
    },
    {
      question: "Який килимок Artisan обрати?",
      answer: "Для контролю в CS2 чи Valorant беріть Zero або Type-99. Для швидкого трекінгу підійде Raiden. Hien, Key-83 і Hayate-Otsu тримають баланс між швидкістю й зупинкою."
    },
    {
      question: "Чим відрізняються бази XSOFT, SOFT і MID?",
      answer: "Це жорсткість піни під тканиною. XSOFT найм’якша й дає найбільше контролю, MID найжорсткіша й найшвидша, SOFT посередині."
    },
    {
      question: "Скільки чекати на замовлення?",
      answer: "Зазвичай 2–4 тижні: килимок їде з Японії, після чого відправляємо його Новою поштою й надсилаємо номер ТТН."
    },
    {
      question: "Як оплатити замовлення?",
      answer: "Повна передоплата на банку Monobank: карткою будь-якого банку, Apple Pay або Google Pay. Після оформлення відкривається сторінка з сумою та кнопкою оплати."
    }
  ];
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } }))
  };
}
