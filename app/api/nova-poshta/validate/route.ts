import { NextResponse } from "next/server";
import { novaPoshtaRequest } from "@/lib/nova-poshta";

type NovaPoshtaCity = { Ref: string };
type NovaPoshtaWarehouse = { Ref: string };

export async function POST(request: Request) {
  let body: { cityRef?: unknown; warehouseRef?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некоректні дані доставки." }, { status: 400 });
  }

  const cityRef = typeof body.cityRef === "string" ? body.cityRef.trim() : "";
  const warehouseRef = typeof body.warehouseRef === "string" ? body.warehouseRef.trim() : "";
  const validRef = /^[a-f0-9-]{36}$/i;
  if (!validRef.test(cityRef) || !validRef.test(warehouseRef)) {
    return NextResponse.json({ error: "Оберіть місто та відділення зі списків Нової пошти." }, { status: 400 });
  }

  try {
    const [cities, warehouses] = await Promise.all([
      novaPoshtaRequest<NovaPoshtaCity>("Address", "getCities", { Ref: cityRef, Limit: "1", Page: "1" }),
      novaPoshtaRequest<NovaPoshtaWarehouse>("Address", "getWarehouses", { CityRef: cityRef, Limit: "500", Page: "1" })
    ]);
    const cityExists = cities.some((city) => city.Ref === cityRef);
    const warehouseBelongsToCity = warehouses.some((warehouse) => warehouse.Ref === warehouseRef);
    if (!cityExists || !warehouseBelongsToCity) {
      return NextResponse.json({ error: "Вибране відділення не знайдено у цьому місті." }, { status: 400 });
    }
    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Nova Poshta delivery validation failed", error);
    return NextResponse.json({ error: "Не вдалося перевірити дані доставки. Спробуйте ще раз." }, { status: 503 });
  }
}
