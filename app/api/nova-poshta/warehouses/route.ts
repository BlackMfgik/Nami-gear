import { NextResponse } from "next/server";
import { novaPoshtaRequest } from "@/lib/nova-poshta";

type NovaPoshtaWarehouse = {
  Ref: string;
  Description: string;
  ShortAddress?: string;
  Number?: string;
};

export async function GET(request: Request) {
  const cityRef = new URL(request.url).searchParams.get("cityRef")?.trim() ?? "";
  if (!/^[a-f0-9-]{36}$/i.test(cityRef)) {
    return NextResponse.json({ error: "Некоректне місто." }, { status: 400 });
  }

  try {
    const data = await novaPoshtaRequest<NovaPoshtaWarehouse>("Address", "getWarehouses", {
      CityRef: cityRef,
      Limit: "500",
      Page: "1"
    });
    const warehouses = data.map((warehouse) => ({
      ref: warehouse.Ref,
      description: warehouse.Description,
      shortAddress: warehouse.ShortAddress ?? "",
      number: warehouse.Number ?? ""
    }));
    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error("Nova Poshta warehouse lookup failed", error);
    return NextResponse.json({ error: "Не вдалося завантажити відділення Нової пошти." }, { status: 503 });
  }
}
