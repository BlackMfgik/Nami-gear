import { NextResponse } from "next/server";
import { artisanProductIds, getArtisanStock, STOREFRONT_MAX_AGE_MS, syncArtisanStock } from "@/lib/artisan";
import { expireUnpaidOrders, pollJarPayments } from "@/lib/payments";
import { matchesSecret } from "@/lib/secrets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const key = new URL(request.url).searchParams.get("key");
  if (!matchesSecret(bearer ?? key, process.env.CRON_SECRET)) return new NextResponse("forbidden", { status: 403 });

  const run = async <T,>(task: () => Promise<T>) => {
    try {
      return await task();
    } catch (error) {
      console.error("Cron task failed", error);
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  const payments = await run(pollJarPayments);
  const expired = await run(expireUnpaidOrders);
  const artisan = await run(async () => {
    const { staleIds } = await getArtisanStock({ ids: artisanProductIds, maxAgeMs: STOREFRONT_MAX_AGE_MS / 2 });
    return staleIds.length ? await syncArtisanStock(staleIds) : { synced: [], failed: [] };
  });
  return NextResponse.json({ payments, expired, artisan });
}
