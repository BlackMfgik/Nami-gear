import { NextResponse } from "next/server";
import { FREE_SHIPPING_THRESHOLD_UAH } from "@/lib/shipping";
import { novaPoshtaRequest } from "@/lib/nova-poshta";

type DocumentPrice = {
  Cost: number | string;
  CostRedelivery?: number | string;
  AssessedCost?: number | string;
};

export async function POST(request: Request) {
  let body: { cityRef?: unknown; subtotal?: unknown; weightKg?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некоректні дані для розрахунку доставки." }, { status: 400 });
  }

  const cityRef = typeof body.cityRef === "string" ? body.cityRef.trim() : "";
  const subtotal = typeof body.subtotal === "number" ? body.subtotal : Number.NaN;
  const weightKg = typeof body.weightKg === "number" ? body.weightKg : Number.NaN;
  if (!/^[a-f0-9-]{36}$/i.test(cityRef) || !Number.isFinite(subtotal) || subtotal <= 0 || subtotal > 10_000_000 || !Number.isFinite(weightKg) || weightKg < 0.1 || weightKg > 1000) {
    return NextResponse.json({ error: "Некоректні параметри доставки." }, { status: 400 });
  }

  if (subtotal > FREE_SHIPPING_THRESHOLD_UAH) return NextResponse.json({ cost: 0, free: true });

  const senderCityRef = process.env.NOVA_POSHTA_SENDER_CITY_REF?.trim() ?? "";
  if (!/^[a-f0-9-]{36}$/i.test(senderCityRef)) {
    return NextResponse.json({ error: "Не налаштовано місто відправлення Нової пошти." }, { status: 503 });
  }

  try {
    const data = await novaPoshtaRequest<DocumentPrice>("InternetDocument", "getDocumentPrice", {
      CitySender: senderCityRef,
      CityRecipient: cityRef,
      ServiceType: "WarehouseWarehouse",
      CargoType: "Parcel",
      Weight: String(weightKg),
      Cost: String(Math.max(300, Math.round(subtotal))),
      SeatsAmount: "1"
    });
    const cost = Number(data[0]?.Cost);
    if (!Number.isFinite(cost) || cost < 0) throw new Error("Nova Poshta returned an invalid delivery cost");
    return NextResponse.json({ cost, free: false });
  } catch (error) {
    console.error("Nova Poshta shipping quote failed", error);
    return NextResponse.json({ error: "Не вдалося розрахувати доставку Нової пошти." }, { status: 503 });
  }
}
