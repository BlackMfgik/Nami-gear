const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";

type NovaPoshtaResponse<T> = {
  success: boolean;
  data: T[];
  errors?: string[];
  warnings?: string[];
};

export async function novaPoshtaRequest<T>(
  modelName: "Address" | "AddressGeneral" | "InternetDocument",
  calledMethod: "getCities" | "getWarehouses" | "getDocumentPrice",
  methodProperties: Record<string, string>
) {
  const apiKey = process.env.NOVA_POSHTA_API_KEY;
  if (!apiKey) throw new Error("NOVA_POSHTA_API_KEY is not configured");

  const response = await fetch(NOVA_POSHTA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
    cache: "no-store"
  });

  if (!response.ok) throw new Error(`Nova Poshta API returned ${response.status}`);
  const result = await response.json() as NovaPoshtaResponse<T>;
  if (!result.success) throw new Error(result.errors?.join(", ") || "Nova Poshta API request failed");
  return result.data;
}
