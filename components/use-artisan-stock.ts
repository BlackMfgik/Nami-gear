"use client";

import { useQuery } from "@tanstack/react-query";
import type { ArtisanStockResponse } from "@/lib/types";

export function useArtisanStock(initialStock?: ArtisanStockResponse) {
  return useQuery<ArtisanStockResponse>({
    queryKey: ["artisan-stock"],
    queryFn: async () => {
      const response = await fetch("/api/artisan-stock");
      if (!response.ok) throw new Error("Stock request failed");
      return response.json();
    },
    initialData: initialStock,
    refetchInterval: 60_000,
    retry: 1
  });
}
