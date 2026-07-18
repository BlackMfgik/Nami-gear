import { NextResponse } from "next/server";
import { getArtisanStock } from "@/lib/artisan";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getArtisanStock(), {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" }
  });
}
