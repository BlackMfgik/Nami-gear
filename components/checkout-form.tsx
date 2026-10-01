"use client";

import { ArrowLeft, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { formatUAH } from "@/lib/catalog";
import { useCart } from "@/store/cart";
import { ProductVisual } from "@/components/product-visual";
import { NovaPoshtaSelectors } from "@/components/nova-poshta-selectors";
import {
  estimateShippingWeightKg,
  qualifiesForFreeShipping,
} from "@/lib/shipping";

export function CheckoutForm({ jarEnabled }: { jarEnabled: boolean }) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [deliveryError, setDeliveryError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shippingQuote, setShippingQuote] = useState<number | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const quoteRequestId = useRef(0);
  const lastQuotedCityRef = useRef("");
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const freeShipping = qualifiesForFreeShipping(subtotal, items.length > 0);
  const estimatedWeightKg = estimateShippingWeightKg(items);
  const shipping = freeShipping ? 0 : shippingQuote;
  const total = subtotal + (shipping ?? 0);

  const updateDeliverySelection = async ({
    cityRef,
  }: {
    cityRef: string;
    warehouseRef: string;
  }) => {
    setDeliveryError("");
    if (!cityRef || freeShipping) {
      quoteRequestId.current += 1;
      lastQuotedCityRef.current = "";
      setShippingQuote(null);
      setShippingLoading(false);
      setShippingError("");
      return;
    }
    if (lastQuotedCityRef.current === cityRef) return;

    const requestId = ++quoteRequestId.current;
    lastQuotedCityRef.current = cityRef;
    setShippingQuote(null);
    setShippingLoading(true);
    setShippingError("");
    try {
      const response = await fetch("/api/nova-poshta/shipping-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityRef,
          subtotal,
          weightKg: estimatedWeightKg,
        }),
      });
      const result = (await response.json()) as {
        cost?: number;
        error?: string;
      };
      if (!response.ok || typeof result.cost !== "number")
        throw new Error(result.error || "Не вдалося розрахувати доставку.");
      if (requestId === quoteRequestId.current) setShippingQuote(result.cost);
    } catch (error) {
      if (requestId !== quoteRequestId.current) return;
      lastQuotedCityRef.current = "";
      setShippingError(
        error instanceof Error
          ? error.message
          : "Не вдалося розрахувати доставку.",
      );
    } finally {
      if (requestId === quoteRequestId.current) setShippingLoading(false);
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length) return;
    const formData = new FormData(event.currentTarget);
    const cityRef = formData.get("cityRef");
    const warehouseRef = formData.get("warehouseRef");
    if (!cityRef || !warehouseRef) {
      setDeliveryError("Оберіть місто та відділення зі списків Нової пошти.");
      return;
    }
    if (!freeShipping && shippingQuote === null) {
      setDeliveryError("Дочекайтеся розрахунку вартості доставки.");
      return;
    }
    setSubmitting(true);
    setDeliveryError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          city: formData.get("city"),
          cityRef,
          warehouse: formData.get("warehouse"),
          warehouseRef,
          comment: formData.get("comment"),
          items: items.map((item) => ({
            productId: item.productId,
            base: item.base,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
        }),
      });
      const result = (await response.json()) as {
        orderNumber?: string;
        error?: string;
      };
      if (!response.ok || !result.orderNumber)
        throw new Error(result.error || "Не вдалося створити замовлення.");
      clear();
      router.push(`/order/${result.orderNumber}`);
    } catch (error) {
      setDeliveryError(
        error instanceof Error
          ? error.message
          : "Не вдалося перевірити дані доставки.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-sand py-5 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          До магазину
        </Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <form onSubmit={submit} className="space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-card sm:p-7">
              <h1 className="font-display text-2xl font-bold">
                Оформлення замовлення
              </h1>
              <p className="mt-2 text-sm text-muted">
                Заповніть контактні дані для доставки.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Ім’я"
                  name="firstName"
                  autoComplete="given-name"
                  maxLength={80}
                  required
                />
                <Field
                  label="Прізвище"
                  name="lastName"
                  autoComplete="family-name"
                  maxLength={80}
                  required
                />
                <Field
                  label="Телефон"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="380991234567"
                  pattern="(?:380[0-9]{9}|0[0-9]{9})"
                  title="Введіть 10 цифр з 0 або 12 цифр з 380"
                  maxLength={12}
                  digitsOnly
                  required
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Необов’язково"
                  pattern="[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}"
                  title="Введіть email у форматі name@example.com"
                  maxLength={160}
                />
              </div>
            </section>
            <section className="rounded-3xl bg-white p-5 shadow-card sm:p-7">
              <h2 className="font-display text-lg font-semibold">Доставка</h2>
              <div className="mt-5">
                <NovaPoshtaSelectors
                  error={deliveryError || shippingError}
                  onSelectionChange={updateDeliverySelection}
                />
              </div>
              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-semibold text-muted">
                  Коментар
                </span>
                <textarea
                  name="comment"
                  className="field min-h-24 resize-y py-3"
                  placeholder="Необов’язково"
                />
              </label>
            </section>
            <section className="rounded-3xl bg-white p-5 shadow-card sm:p-7">
              <h2 className="font-display text-lg font-semibold">Оплата</h2>
              {jarEnabled ? (
                <div className="mt-4 rounded-2xl border border-ink p-4">
                  <strong className="block text-sm">
                    Повна передоплата на банку Monobank
                  </strong>
                  <span className="text-xs leading-5 text-muted">
                    Карткою будь-якого банку, Apple Pay або Google Pay. Після
                    оплати замовляємо килимок і надсилаємо ТТН.
                  </span>
                </div>
              ) : (
                <p className="mt-4 text-sm text-red-700">
                  Оплата тимчасово недоступна. Напишіть нам у Telegram.
                </p>
              )}
            </section>
            <button
              className="btn-primary w-full"
              disabled={!jarEnabled || !items.length || submitting || shippingLoading}
            >
              {shippingLoading
                ? "Розраховуємо доставку…"
                : submitting
                  ? "Створюємо замовлення…"
                  : "Перейти до оплати"}
            </button>
          </form>
          <aside className="h-fit rounded-3xl bg-white p-5 shadow-card lg:sticky lg:top-6 sm:p-6">
            <h2 className="font-display text-lg font-semibold">
              Ваше замовлення
            </h2>
            {items.length ? (
              <div className="mt-5 space-y-4">
                {items.map((item) => (
                  <div key={item.key} className="flex gap-3">
                    <ProductVisual
                      product={{
                        brand: item.brand ?? "",
                        name: item.name,
                        image: item.image,
                      }}
                      className="size-16 shrink-0 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {item.name}
                      </p>
                      <p className="mt-1 font-mono text-[9px] uppercase text-muted">
                        {item.size} · {item.color} · ×{item.quantity}
                      </p>
                    </div>
                    <span className="font-display text-xs font-bold">
                      {formatUAH(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <ShoppingBag className="mx-auto size-7 text-muted" />
                <p className="mt-3 text-sm text-muted">Кошик порожній</p>
              </div>
            )}
            <div className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
              <div className="flex justify-between text-muted">
                <span>Товари</span>
                <span>{formatUAH(subtotal)}</span>
              </div>
              <div className="flex justify-between gap-4 text-muted">
                <span>Доставка</span>
                <span
                  className={`text-right ${freeShipping ? "font-semibold text-green-700" : ""}`}
                >
                  {freeShipping
                    ? "Безкоштовно"
                    : shippingLoading
                      ? "Розраховуємо…"
                      : shipping === null
                        ? "Оберіть місто"
                        : formatUAH(shipping)}
                </span>
              </div>
              <div className="flex justify-between border-t border-line pt-3 font-display text-lg font-bold">
                <span>Разом</span>
                <span>{formatUAH(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  pattern,
  title,
  hint,
  maxLength,
  digitsOnly,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  inputMode?: "email" | "tel" | "numeric";
  autoComplete?: string;
  placeholder?: string;
  pattern?: string;
  title?: string;
  hint?: string;
  maxLength?: number;
  digitsOnly?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-muted">
        {label}
      </span>
      <input
        className="field"
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        pattern={pattern}
        title={title}
        maxLength={maxLength}
        onInput={
          digitsOnly
            ? (event) => {
                event.currentTarget.value = event.currentTarget.value.replace(
                  /\D/g,
                  "",
                );
              }
            : undefined
        }
        required={required}
      />
      {hint && (
        <span className="mt-1.5 block text-[11px] text-muted">{hint}</span>
      )}
    </label>
  );
}
