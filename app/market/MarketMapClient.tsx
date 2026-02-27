"use client";

import Link from "next/link";
import { type MouseEvent, useEffect, useMemo, useState } from "react";

export type StateStore = {
  name: string;
  website?: string;
  city?: string;
  state: string;
  rating?: number;
  reviewCount?: number;
  reviewSource?: string;
};

export type StateListing = {
  id: string;
  name: string;
  category: "Ingredients" | "Clays" | "Tools" | "Machines" | "Kilns";
  supplier: string;
  condition: "New" | "Used" | "Refurbished";
  price: number | null;
  currency: string;
  imageUrl: string;
};

type Props = {
  stateStores: Record<string, StateStore[]>;
  stateListings: Record<string, StateListing[]>;
};

type StateHotspot = {
  code: string;
  name: string;
  x: number;
  y: number;
};

const STATE_HOTSPOTS: StateHotspot[] = [
  { code: "WA", name: "Washington", x: 24.6, y: 15.74 },
  { code: "OR", name: "Oregon", x: 23, y: 25.19 },
  { code: "CA", name: "California", x: 21.9, y: 46.88 },
  { code: "NV", name: "Nevada", x: 24.9, y: 37.78 },
  { code: "ID", name: "Idaho", x: 28.7, y: 28.51 },
  { code: "MT", name: "Montana", x: 37.9, y: 23.44 },
  { code: "WY", name: "Wyoming", x: 37.8, y: 33.24 },
  { code: "UT", name: "Utah", x: 33.9, y: 45.48 },
  { code: "AZ", name: "Arizona", x: 31.5, y: 55.28 },
  { code: "CO", name: "Colorado", x: 39, y: 44.96 },
  { code: "NM", name: "New Mexico", x: 37.8, y: 56.5 },
  { code: "ND", name: "North Dakota", x: 45.9, y: 22.39 },
  { code: "SD", name: "South Dakota", x: 46.4, y: 32.01 },
  { code: "NE", name: "Nebraska", x: 46.7, y: 38.48 },
  { code: "KS", name: "Kansas", x: 48.1, y: 46.36 },
  { code: "OK", name: "Oklahoma", x: 49.6, y: 54.75 },
  { code: "TX", name: "Texas", x: 46, y: 65.42 },
  { code: "MN", name: "Minnesota", x: 53.2, y: 23.27 },
  { code: "IA", name: "Iowa", x: 54, y: 36.91 },
  { code: "MO", name: "Missouri", x: 55.2, y: 46.36 },
  { code: "AR", name: "Arkansas", x: 56.1, y: 56.15 },
  { code: "LA", name: "Louisiana", x: 56.2, y: 65.6 },
  { code: "WI", name: "Wisconsin", x: 59, y: 27.81 },
  { code: "IL", name: "Illinois", x: 59.8, y: 39.53 },
  { code: "MS", name: "Mississippi", x: 55.7, y: 45.83 },
  { code: "MI", name: "Michigan", x: 64.3, y: 31.66 },
  { code: "IN", name: "Indiana", x: 62.8, y: 41.11 },
  { code: "KY", name: "Kentucky", x: 65.4, y: 47.41 },
  { code: "TN", name: "Tennessee", x: 64.1, y: 51.78 },
  { code: "AL", name: "Alabama", x: 64.3, y: 60.53 },
  { code: "GA", name: "Georgia", x: 68.2, y: 60.53 },
  { code: "FL", name: "Florida", x: 72.9, y: 72.42 },
  { code: "OH", name: "Ohio", x: 67.8, y: 37.96 },
  { code: "WV", name: "West Virginia", x: 70.4, y: 43.21 },
  { code: "VA", name: "Virginia", x: 73.8, y: 43.03 },
  { code: "NC", name: "North Carolina", x: 73.7, y: 50.2 },
  { code: "SC", name: "South Carolina", x: 72.6, y: 55.45 },
  { code: "PA", name: "Pennsylvania", x: 73.3, y: 36.56 },
  { code: "NY", name: "New York", x: 75.4, y: 27.46 },
  { code: "NJ", name: "New Jersey", x: 77.6, y: 36.91 },
  { code: "DE", name: "Delaware", x: 76.7, y: 39.71 },
  { code: "MD", name: "Maryland", x: 74.9, y: 39.18 },
  { code: "CT", name: "Connecticut", x: 78.8, y: 31.31 },
  { code: "RI", name: "Rhode Island", x: 80.5, y: 30.44 },
  { code: "MA", name: "Massachusetts", x: 80.4, y: 28.16 },
  { code: "VT", name: "Vermont", x: 77.7, y: 24.14 },
  { code: "NH", name: "New Hampshire", x: 79.3, y: 25.36 },
  { code: "ME", name: "Maine", x: 81.1, y: 18.19 },
  { code: "AK", name: "Alaska", x: 4.4, y: 9.97 },
  { code: "HI", name: "Hawaii", x: 10.1, y: 79.07 },
];

const CALIBRATION_STORAGE_KEY = "market-map-calibration-v1";
const SHOW_CALIBRATION_TOOLS = process.env.NODE_ENV !== "production";

function stars(rating?: number) {
  if (!rating) return "☆☆☆☆☆";
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

export default function MarketMapClient({ stateStores, stateListings }: Props) {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationState, setCalibrationState] = useState(STATE_HOTSPOTS[0]?.code ?? "CA");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [calibrationPoints, setCalibrationPoints] = useState<Record<string, { x: number; y: number }>>(
    Object.fromEntries(STATE_HOTSPOTS.map((spot) => [spot.code, { x: spot.x, y: spot.y }])),
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CALIBRATION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, { x: number; y: number }>;
      if (!parsed || typeof parsed !== "object") return;
      setCalibrationPoints((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(calibrationPoints));
    } catch {
      // ignore storage errors
    }
  }, [calibrationPoints]);

  const calibrationOutput = useMemo(
    () =>
      STATE_HOTSPOTS.map((spot) => {
        const point = calibrationPoints[spot.code] ?? { x: spot.x, y: spot.y };
        return `  { code: "${spot.code}", name: "${spot.name}", x: ${Number(point.x.toFixed(2))}, y: ${Number(point.y.toFixed(2))} },`;
      }).join("\n"),
    [calibrationPoints],
  );

  const handleCalibrateClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!SHOW_CALIBRATION_TOOLS || !calibrationMode) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    const safeX = Math.max(0, Math.min(100, Number(x.toFixed(2))));
    const safeY = Math.max(0, Math.min(100, Number(y.toFixed(2))));

    setCalibrationPoints((prev) => ({
      ...prev,
      [calibrationState]: { x: safeX, y: safeY },
    }));

    const currentIndex = STATE_HOTSPOTS.findIndex((spot) => spot.code === calibrationState);
    if (currentIndex >= 0 && currentIndex < STATE_HOTSPOTS.length - 1) {
      setCalibrationState(STATE_HOTSPOTS[currentIndex + 1].code);
    }
  };

  const resetCalibrationPoints = () => {
    setCalibrationPoints(Object.fromEntries(STATE_HOTSPOTS.map((spot) => [spot.code, { x: spot.x, y: spot.y }])));
    setCalibrationState(STATE_HOTSPOTS[0]?.code ?? "CA");
    setCopyStatus("idle");
  };

  const copyCalibrationBlock = async () => {
    try {
      await navigator.clipboard.writeText(`const STATE_HOTSPOTS: StateHotspot[] = [\n${calibrationOutput}\n];`);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("failed");
      setTimeout(() => setCopyStatus("idle"), 1800);
    }
  };

  const selectedMeta = useMemo(
    () => STATE_HOTSPOTS.find((spot) => spot.code === selectedState) ?? null,
    [selectedState],
  );

  const stores = selectedState ? stateStores[selectedState] ?? [] : [];
  const listings = selectedState ? stateListings[selectedState] ?? [] : [];

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center pt-28 pb-20 px-4">
      <h1 className="text-5xl font-bold mb-4">Market</h1>
      <p className="text-sm text-[#F2E6C8]/85 mb-6 text-center max-w-3xl">
        Select a state to open a pottery market popout with clay stores, tools, machines, kilns, clays, and ingredients.
      </p>

      {SHOW_CALIBRATION_TOOLS ? (
        <div className="w-full max-w-7xl mb-3 rounded-lg bg-[#3B2A1F]/60 p-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setCalibrationMode((prev) => !prev)}
              className="px-3 py-1.5 rounded bg-[#A44E32] text-[#F2E3C7] hover:bg-[#4A2F1C]"
            >
              {calibrationMode ? "Calibration: ON" : "Calibration: OFF"}
            </button>

            {calibrationMode ? (
              <>
                <label className="text-[#F2E6C8]/85">State</label>
                <select
                  value={calibrationState}
                  onChange={(event) => setCalibrationState(event.target.value)}
                  className="px-2 py-1 rounded bg-[#4A2F1C] text-[#F2E6C8]"
                >
                  {STATE_HOTSPOTS.map((spot) => (
                    <option key={spot.code} value={spot.code}>
                      {spot.code} — {spot.name}
                    </option>
                  ))}
                </select>

                <span className="text-[#F2E6C8]/80">
                  Click map to save center for {calibrationState}
                </span>

                <button
                  type="button"
                  onClick={copyCalibrationBlock}
                  className="px-3 py-1.5 rounded bg-[#A44E32] text-[#F2E3C7] hover:bg-[#4A2F1C]"
                >
                  {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy block"}
                </button>

                <button
                  type="button"
                  onClick={resetCalibrationPoints}
                  className="px-3 py-1.5 rounded bg-[#4A2F1C] text-[#F2E3C7] hover:bg-[#3B2A1F]"
                >
                  Reset points
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="w-full max-w-7xl rounded-xl bg-[#3B2A1F]/55 p-3 sm:p-6">
        <div className="relative w-full overflow-hidden rounded-lg" onClick={handleCalibrateClick}>
          <img src="/map%20for%20app.png" alt="United States pottery market map" className="w-full h-auto" />

          {SHOW_CALIBRATION_TOOLS && calibrationMode ? <div className="absolute inset-0 cursor-crosshair" /> : null}

          <div className="absolute inset-0">
            {STATE_HOTSPOTS.map((spot) => {
              const hasData = (stateListings[spot.code]?.length ?? 0) > 0 || (stateStores[spot.code]?.length ?? 0) > 0;
              const point = calibrationPoints[spot.code] ?? { x: spot.x, y: spot.y };
              return (
                <div key={spot.code}>
                  <button
                    type="button"
                    onClick={() => {
                      if (SHOW_CALIBRATION_TOOLS && calibrationMode) {
                        setCalibrationState(spot.code);
                        return;
                      }
                      setSelectedState(spot.code);
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors w-3 h-3 sm:w-4 sm:h-4 ${
                      hasData
                        ? "bg-[#A44E32] hover:bg-[#4A2F1C]"
                        : "bg-[#3B2A1F]/85 hover:bg-[#3B2A1F]"
                    } ${selectedState === spot.code || calibrationState === spot.code ? "ring-2 ring-[#F2E3C7]" : ""}`}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    aria-label={`Open ${spot.name} market popout`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {SHOW_CALIBRATION_TOOLS && calibrationMode ? (
        <div className="w-full max-w-7xl mt-3 rounded-lg bg-[#3B2A1F]/60 p-3">
          <p className="text-xs text-[#F2E6C8]/85 mb-2">
            Copy this and replace STATE_HOTSPOTS in MarketMapClient.tsx
          </p>
          <textarea
            readOnly
            value={`const STATE_HOTSPOTS: StateHotspot[] = [\n${calibrationOutput}\n];`}
            className="w-full h-44 rounded bg-[#4A2F1C] text-[#F2E6C8] text-[11px] p-2"
          />
        </div>
      ) : null}

      {selectedMeta ? (
        <div className="fixed inset-0 z-50 bg-black/60 px-4 py-8 flex items-center justify-center" onClick={() => setSelectedState(null)}>
          <div
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#3B2A1F] rounded-xl shadow-xl p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-3xl font-semibold">{selectedMeta.name} ({selectedMeta.code})</h2>
                <p className="text-sm text-[#F2E6C8]/80 mt-1">
                  {stores.length} store entries • {listings.length} pottery listings
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedState(null)}
                className="text-2xl leading-none px-2 py-1 rounded-md hover:bg-[#F2E6C8]/10"
                aria-label="Close state popout"
              >
                ×
              </button>
            </div>

            <section className="mt-5">
              <h3 className="text-xl font-semibold">Clay Stores</h3>
              {stores.length > 0 ? (
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {stores.map((store) => (
                    <div key={`${store.name}-${store.state}`} className="rounded-lg bg-[#4A2F1C]/70 p-3">
                      <p className="font-semibold text-[#F2E3C7]">{store.name}</p>
                      <p className="text-xs text-[#F2E6C8]/80">{store.city ? `${store.city}, ${store.state}` : store.state}</p>
                      <p className="text-xs text-[#F2E6C8]/80 mt-1">
                        {stars(store.rating)} {store.rating ? `${store.rating.toFixed(1)} (${store.reviewCount ?? 0})` : "No rating"}
                      </p>
                      {store.website ? (
                        <a href={store.website} target="_blank" rel="noreferrer" className="text-xs text-[#F2E3C7] underline mt-1 inline-block">
                          Visit store
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#F2E6C8]/75 mt-2">No store profile yet for this state.</p>
              )}
            </section>

            <section className="mt-6">
              <h3 className="text-xl font-semibold">Potter Supplies & Tools</h3>
              {listings.length > 0 ? (
                <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {listings.slice(0, 24).map((listing) => (
                    <div key={listing.id} className="rounded-lg bg-[#4A2F1C]/75 p-3">
                      <img src={listing.imageUrl} alt={listing.name} className="w-full h-32 object-cover rounded-md mb-2" />
                      <p className="font-semibold text-sm">{listing.name}</p>
                      <p className="text-xs text-[#F2E6C8]/80">{listing.category} • {listing.condition}</p>
                      <p className="text-xs text-[#F2E6C8]/80">{listing.supplier}</p>
                      <p className="text-xs text-[#F2E6C8]/85 mt-1">
                        {listing.price != null ? `${listing.currency} ${listing.price}` : "Price on supplier site"}
                      </p>
                      <Link href={`/market/${listing.id}`} className="mt-2 inline-block text-xs underline text-[#F2E3C7]">
                        Open listing
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#F2E6C8]/75 mt-2">No active pottery listings yet for this state.</p>
              )}

              {listings.length > 24 ? (
                <Link
                  href={`/market/state/${encodeURIComponent(selectedMeta.code.toLowerCase())}`}
                  className="mt-3 inline-block text-sm underline text-[#F2E3C7]"
                >
                  View all {listings.length} listings in {selectedMeta.code}
                </Link>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}
