import { NextResponse } from "next/server";
import { novaPoshtaRequest } from "@/lib/nova-poshta";

type NovaPoshtaCity = {
  Ref: string;
  Description: string;
  AreaDescription?: string;
  SettlementTypeDescription?: string;
};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("query")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ cities: [] });

  try {
    const data = await novaPoshtaRequest<NovaPoshtaCity>("Address", "getCities", {
      FindByString: query.slice(0, 80),
      Limit: "20",
      Page: "1"
    });
    const cities = data.map((city) => ({
      ref: city.Ref,
      name: city.Description,
      area: city.AreaDescription ?? "",
      type: city.SettlementTypeDescription ?? ""
    }));
    return NextResponse.json({ cities });
  } catch (error) {
    console.error("Nova Poshta city lookup failed", error);
    return NextResponse.json({ error: "Не вдалося завантажити міста Нової пошти." }, { status: 503 });
  }
}
