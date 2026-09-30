import { after, NextResponse } from "next/server";
import { getArtisanStock, syncArtisanStock } from "@/lib/artisan";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const { staleIds, ...stock } = await getArtisanStock();
  if (staleIds.length) after(() => syncArtisanStock(staleIds).then(() => undefined));
  return NextResponse.json(stock, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" }
  });
}
