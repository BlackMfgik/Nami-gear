const MONO_API_URL = "https://api.monobank.ua";

export type MonoStatementItem = {
  id: string;
  time: number;
  description?: string;
  comment?: string;
  amount: number;
  currencyCode?: number;
  balance?: number;
};

export function monoConfig() {
  const token = process.env.MONO_API_TOKEN?.trim() ?? "";
  const jarId = process.env.MONO_JAR_ID?.trim() ?? "";
  return token && jarId ? { token, jarId } : null;
}

export function jarUrl() {
  const url = process.env.MONO_JAR_URL?.trim() ?? "";
  return /^https:\/\/send\.monobank\.ua\/jar\/[A-Za-z0-9]+$/.test(url) ? url : null;
}

export function jarPaymentLink(payableKop: number, orderNumber: string) {
  const url = jarUrl();
  if (!url) return null;
  const params = new URLSearchParams({ a: (payableKop / 100).toFixed(2), t: orderNumber });
  return `${url}?${params}`;
}

export async function fetchJarStatement(hours = 6): Promise<MonoStatementItem[]> {
  const config = monoConfig();
  if (!config) return [];
  const from = Math.floor(Date.now() / 1000) - hours * 3600;
  const response = await fetch(`${MONO_API_URL}/personal/statement/${config.jarId}/${from}`, {
    headers: { "X-Token": config.token },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000)
  });
  // Statement is limited to one request per 60 s.
  if (response.status === 429) return [];
  if (!response.ok) throw new Error(`Monobank statement HTTP ${response.status}`);
  return await response.json() as MonoStatementItem[];
}
