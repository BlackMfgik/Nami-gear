"use client";

import { useEffect, useMemo, useState } from "react";

type City = { ref: string; name: string; area: string; type: string };
type Warehouse = { ref: string; description: string; shortAddress: string; number: string };

function cityLabel(city: City) {
  return [city.type, city.name, city.area && `${city.area} обл.`].filter(Boolean).join(" ");
}

export function NovaPoshtaSelectors({ error, onSelectionChange }: { error?: string; onSelectionChange?: (selection: { cityRef: string; warehouseRef: string }) => void }) {
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseRef, setWarehouseRef] = useState("");
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const cityOptions = useMemo(() => new Map(cities.map((city) => [cityLabel(city), city])), [cities]);
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.ref === warehouseRef) ?? null;

  useEffect(() => {
    if (selectedCity || cityQuery.trim().length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLookupError("");
      try {
        const response = await fetch(`/api/nova-poshta/cities?query=${encodeURIComponent(cityQuery.trim())}`, { signal: controller.signal });
        const body = await response.json() as { cities?: City[]; error?: string };
        if (!response.ok) throw new Error(body.error || "Не вдалося знайти місто.");
        setCities(body.cities ?? []);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setLookupError(requestError instanceof Error ? requestError.message : "Не вдалося знайти місто.");
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cityQuery, selectedCity]);

  useEffect(() => {
    if (!selectedCity) return;

    const controller = new AbortController();
    fetch(`/api/nova-poshta/warehouses?cityRef=${encodeURIComponent(selectedCity.ref)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as { warehouses?: Warehouse[]; error?: string };
        if (!response.ok) throw new Error(body.error || "Не вдалося завантажити відділення.");
        setWarehouses(body.warehouses ?? []);
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setLookupError(requestError instanceof Error ? requestError.message : "Не вдалося завантажити відділення.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setWarehousesLoading(false);
      });
    return () => controller.abort();
  }, [selectedCity]);

  const selectCity = (value: string) => {
    setCityQuery(value);
    const city = cityOptions.get(value) ?? null;
    setSelectedCity(city);
    setWarehouses([]);
    setWarehouseRef("");
    setWarehousesLoading(Boolean(city));
    setLookupError("");
    if (!city && value.trim().length < 2) setCities([]);
    onSelectionChange?.({ cityRef: city?.ref ?? "", warehouseRef: "" });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="mb-2 block text-xs font-semibold text-muted">Місто</span>
        <input
          className="field"
          list="nova-poshta-cities"
          value={cityQuery}
          onChange={(event) => selectCity(event.target.value)}
          placeholder="Почніть вводити місто"
          autoComplete="off"
          required
        />
        <datalist id="nova-poshta-cities">{cities.map((city) => <option key={city.ref} value={cityLabel(city)} />)}</datalist>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold text-muted">Відділення або поштомат Нової пошти</span>
        <select
          className="field"
          value={warehouseRef}
          onChange={(event) => { setWarehouseRef(event.target.value); onSelectionChange?.({ cityRef: selectedCity?.ref ?? "", warehouseRef: event.target.value }); }}
          disabled={!selectedCity || warehousesLoading}
          required
        >
          <option value="">{warehousesLoading ? "Завантажуємо відділення…" : selectedCity ? "Оберіть відділення" : "Спочатку оберіть місто"}</option>
          {warehouses.map((warehouse) => <option key={warehouse.ref} value={warehouse.ref}>{warehouse.description}</option>)}
        </select>
      </label>

      <input type="hidden" name="city" value={selectedCity ? cityLabel(selectedCity) : ""} />
      <input type="hidden" name="cityRef" value={selectedCity?.ref ?? ""} />
      <input type="hidden" name="warehouse" value={selectedWarehouse?.description ?? ""} />
      <input type="hidden" name="warehouseRef" value={selectedWarehouse?.ref ?? ""} />
      {(lookupError || error) && <p className="text-xs font-medium text-red-700 sm:col-span-2" role="alert">{lookupError || error}</p>}
    </div>
  );
}
