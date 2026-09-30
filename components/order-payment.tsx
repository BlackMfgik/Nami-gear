"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, Clock, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

type OrderStatus = {
  orderNumber: string;
  paymentMethod: "cod" | "jar";
  paymentStatus: "not_required" | "pending" | "partial" | "paid" | "expired" | "cancelled";
  totalUAH: number;
  payableKop: number | null;
  paidKop: number;
  link: string | null;
  card: string | null;
};

const formatKop = (kop: number) => `${(kop / 100).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴`;

export function OrderPayment({ orderNumber }: { orderNumber: string }) {
  const { data: order, isError } = useQuery<OrderStatus>({
    queryKey: ["order", orderNumber],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Order not found");
      return response.json();
    },
    refetchInterval: (query) => {
      const status = query.state.data?.paymentStatus;
      return status === "pending" || status === "partial" || status === "expired" ? 5_000 : false;
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 1
  });

  if (isError) {
    return (
      <Shell>
        <AlertCircle className="mx-auto size-8 text-red-700" />
        <h1 className="mt-4 font-display text-2xl font-bold">Замовлення не знайдено</h1>
        <p className="mt-3 text-sm text-muted">Перевірте посилання або напишіть нам у Telegram.</p>
        <Link className="btn-primary mt-7" href="/">До магазину</Link>
      </Shell>
    );
  }
  if (!order) return <Shell><p className="text-sm text-muted">Завантажуємо замовлення…</p></Shell>;

  if (order.paymentMethod !== "jar" || order.paymentStatus === "paid") {
    return (
      <Shell>
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-green-800"><Check className="size-7" /></span>
        <h1 className="mt-5 font-display text-3xl font-bold">{order.paymentStatus === "paid" ? "Оплату отримано" : "Замовлення прийнято"}</h1>
        <p className="mt-3 font-mono text-xs font-semibold uppercase tracking-wider text-warm">№ {order.orderNumber}</p>
        <p className="mt-3 text-sm leading-6 text-muted">Дякуємо! Ми зв’яжемося з вами для підтвердження та надішлемо номер ТТН після відправлення.</p>
        <Link className="btn-primary mt-7" href="/">Повернутися до магазину</Link>
      </Shell>
    );
  }

  if (order.paymentStatus === "cancelled") {
    return (
      <Shell>
        <AlertCircle className="mx-auto size-8 text-muted" />
        <h1 className="mt-4 font-display text-2xl font-bold">Замовлення скасовано</h1>
        <p className="mt-3 text-sm text-muted">Якщо ви вже оплатили, напишіть нам, і ми все владнаємо.</p>
        <Link className="btn-primary mt-7" href="/">До магазину</Link>
      </Shell>
    );
  }

  return <JarPayment order={order} />;
}

function JarPayment({ order }: { order: OrderStatus }) {
  const payable = order.payableKop ?? order.totalUAH * 100;
  const remaining = Math.max(0, payable - order.paidKop);
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!order.link) return;
    QRCode.toString(order.link, { type: "svg", margin: 0, errorCorrectionLevel: "M" }).then(setQr).catch(() => setQr(""));
  }, [order.link]);

  return (
    <Shell>
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-sand"><Clock className="size-6" /></span>
      <h1 className="mt-5 font-display text-2xl font-bold sm:text-3xl">Оплатіть замовлення</h1>
      <p className="mt-2 font-mono text-xs font-semibold uppercase tracking-wider text-warm">№ {order.orderNumber}</p>

      <div className="mt-6 rounded-2xl bg-sand p-5">
        <p className="text-xs text-muted">{order.paymentStatus === "partial" ? "Залишилось сплатити" : "Сума до оплати"}</p>
        <p className="mt-1 font-display text-4xl font-bold tracking-tight">{formatKop(remaining)}</p>
        <p className="mt-2 text-[11px] leading-5 text-muted">Будь ласка, сплатіть точну суму разом із копійками: так ми автоматично знайдемо ваш платіж.</p>
      </div>

      {order.link && (
        <a className="btn-primary mt-5 w-full" href={order.link} target="_blank" rel="noreferrer">
          Оплатити через Monobank <ExternalLink className="size-4" />
        </a>
      )}

      <div className="mt-4 grid gap-2 text-left">
        <CopyRow label="Сума" value={(remaining / 100).toFixed(2)} />
        <CopyRow label="Коментар до платежу" value={order.orderNumber} />
        {order.card && <CopyRow label="Або переказ на картку банки" value={order.card} copyValue={order.card.replace(/\s/g, "")} />}
      </div>

      {qr && (
        <div className="mt-6 hidden sm:block">
          <p className="text-xs text-muted">Або відскануйте камерою телефона</p>
          <div className="mx-auto mt-3 size-40 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
        <span className="size-2 animate-pulse rounded-full bg-amber-500" />
        {order.paymentStatus === "expired" ? "Термін оплати минув, але платіж ще можна надіслати" : "Чекаємо на оплату, сторінка оновиться автоматично"}
      </p>
      <p className="mt-3 text-[11px] leading-5 text-muted">Не можете оплатити? Напишіть нам у <a className="underline hover:text-ink" href="https://t.me/A0klgahara" target="_blank" rel="noreferrer">Telegram</a> і вкажіть номер замовлення.</p>
    </Shell>
  );
}

function CopyRow({ label, value, copyValue = value }: { label: string; value: string; copyValue?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" onClick={copy} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-left transition hover:border-ink">
      <span>
        <span className="block text-[11px] text-muted">{label}</span>
        <span className="font-mono text-sm font-semibold">{value}</span>
      </span>
      {copied ? <Check className="size-4 text-green-700" /> : <Copy className="size-4 text-muted" />}
    </button>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-sand p-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-soft sm:p-10">{children}</div>
    </main>
  );
}
