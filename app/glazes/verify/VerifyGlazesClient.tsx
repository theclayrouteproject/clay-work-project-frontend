"use client";

import { useEffect, useState } from "react";

const shuffleItems = <T,>(items: T[]) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[randomIndex];
    next[randomIndex] = current;
  }
  return next;
};

type RecipeItem = {
  ingredient: string;
  amount: string;
};

type PendingGlaze = {
  recipeId: number;
  name: string;
  maker: string;
  firingCone: string;
  recipe: RecipeItem[];
};

const pendingGlazes: PendingGlaze[] = [
  {
    recipeId: 677131,
    name: "63. Selsor red Cn 6 Colombia Redox",
    maker: "Sirenaazuleja",
    firingCone: "Cone 6",
    recipe: [
      { ingredient: "Nefelina Sienita Minser Colombia", amount: "47.86" },
      { ingredient: "Silica", amount: "18.56" },
      { ingredient: "Frit Boron Alcaline P830", amount: "13.29" },
      { ingredient: "Whiting", amount: "12.95" },
      { ingredient: "Caolin Oiba Blanco", amount: "7.34" },
      { ingredient: "Bentonite", amount: "2.00" },
      { ingredient: "Tin Oxide", amount: "1.50" },
      { ingredient: "Copper Carbonate", amount: "0.80" },
    ],
  },
  {
    recipeId: 713455,
    name: "18. Pearl Bogotá",
    maker: "Sirenaazuleja",
    firingCone: "Cone 3-6",
    recipe: [
      { ingredient: "Frit Boron", amount: "49.00" },
      { ingredient: "Silica", amount: "22.50" },
      { ingredient: "Red clay", amount: "16.25" },
      { ingredient: "Whiting", amount: "12.25" },
      { ingredient: "Titanium Dioxide", amount: "12.00" },
      { ingredient: "Black Nickel Oxide", amount: "2.00" },
      { ingredient: "Red Iron Oxide", amount: "0.80" },
    ],
  },
  {
    recipeId: 677130,
    name: "62. Panama red Cn 6 Colombia Redox",
    maker: "Sirenaazuleja",
    firingCone: "Cone 5.5",
    recipe: [
      { ingredient: "Feldespato potásico", amount: "44.73" },
      { ingredient: "Frit Boron", amount: "14.20" },
      { ingredient: "Silica", amount: "11.87" },
      { ingredient: "Dolomite", amount: "9.13" },
      { ingredient: "Caolin", amount: "7.10" },
      { ingredient: "Strontium Carbonate", amount: "4.26" },
      { ingredient: "Whiting", amount: "4.06" },
      { ingredient: "Zinc Oxide", amount: "2.64" },
      { ingredient: "Bentonite", amount: "2.03" },
      { ingredient: "Tin Oxide", amount: "2.60" },
      { ingredient: "Copper Carbonate", amount: "1.75" },
    ],
  },
  {
    recipeId: 764983,
    name: "tirasp 27",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Feldespato Potásico", amount: "27.91" },
      { ingredient: "Silica", amount: "25.85" },
      { ingredient: "Whiting", amount: "20.00" },
      { ingredient: "Caolín", amount: "16.36" },
      { ingredient: "Colemanita", amount: "9.88" },
      { ingredient: "Chrome Oxide", amount: "0.20" },
      { ingredient: "Titanium Dioxide", amount: "4.00" },
    ],
  },
  {
    recipeId: 677133,
    name: "65. Floating Blue John Britt Cn 6 Colombia Redox",
    maker: "Sirenaazuleja",
    firingCone: "Cone 5.5-6",
    recipe: [
      { ingredient: "Feldespato potásico", amount: "27.91" },
      { ingredient: "Silica", amount: "25.85" },
      { ingredient: "Whiting", amount: "20.00" },
      { ingredient: "Caolin", amount: "16.36" },
      { ingredient: "Colemanita", amount: "9.88" },
      { ingredient: "Red Iron Oxide", amount: "1.00" },
      { ingredient: "Rutile", amount: "3.00" },
    ],
  },
  {
    recipeId: 663506,
    name: "Potash Feldspar Clear (Base)",
    maker: "Trees Wijnands",
    firingCone: "Cone 5-6",
    recipe: [
      { ingredient: "Potash Feldspar", amount: "29.00" },
      { ingredient: "Silica", amount: "27.00" },
      { ingredient: "Whiting", amount: "21.00" },
      { ingredient: "Kaolin", amount: "17.00" },
      { ingredient: "Colemanite", amount: "10.00" },
    ],
  },
  {
    recipeId: 764988,
    name: "tirasp 6",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Feldespato Potásico", amount: "27.91" },
      { ingredient: "Silica", amount: "25.85" },
      { ingredient: "Whiting", amount: "20.00" },
      { ingredient: "Caolín", amount: "16.36" },
      { ingredient: "Colemanita", amount: "9.88" },
      { ingredient: "Chrome Oxide", amount: "0.40" },
      { ingredient: "Titanium Dioxide", amount: "4.00" },
    ],
  },
  {
    recipeId: 764984,
    name: "tirasp 28",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Feldespato Potásico", amount: "27.91" },
      { ingredient: "Silica", amount: "25.85" },
      { ingredient: "Whiting", amount: "20.00" },
      { ingredient: "Caolín", amount: "16.36" },
      { ingredient: "Colemanita", amount: "9.88" },
      { ingredient: "Chrome Oxide", amount: "0.30" },
      { ingredient: "Titanium Dioxide", amount: "4.00" },
    ],
  },
  {
    recipeId: 737122,
    name: "Creamy White Matt #1",
    maker: "Tree.Ceramics",
    firingCone: "Cone 5-6",
    recipe: [
      { ingredient: "Potash Feldspar", amount: "29.00" },
      { ingredient: "Silica", amount: "27.00" },
      { ingredient: "Whiting", amount: "21.00" },
      { ingredient: "Kaolin", amount: "17.00" },
      { ingredient: "Colemanite", amount: "10.00" },
      { ingredient: "Tin Oxide", amount: "5.00" },
    ],
  },
  {
    recipeId: 764977,
    name: "tirasp 21",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Feldespato Potásico", amount: "27.91" },
      { ingredient: "Silica", amount: "25.85" },
      { ingredient: "Whiting", amount: "20.00" },
      { ingredient: "Caolín", amount: "16.36" },
      { ingredient: "Colemanita", amount: "9.88" },
      { ingredient: "Cobalt Oxide", amount: "0.40" },
    ],
  },
  {
    recipeId: 764978,
    name: "tirasp 22",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Feldespato Potásico", amount: "27.91" },
      { ingredient: "Silica", amount: "25.85" },
      { ingredient: "Whiting", amount: "20.00" },
      { ingredient: "Caolín", amount: "16.36" },
      { ingredient: "Colemanita", amount: "9.88" },
      { ingredient: "Cobalt Oxide", amount: "0.50" },
    ],
  },
  {
    recipeId: 764986,
    name: "tirasp 5",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Feldespato Potásico", amount: "27.91" },
      { ingredient: "Silica", amount: "25.85" },
      { ingredient: "Whiting", amount: "20.00" },
      { ingredient: "Caolín", amount: "16.36" },
      { ingredient: "Colemanita", amount: "9.88" },
      { ingredient: "Chrome Oxide", amount: "0.30" },
      { ingredient: "Titanium Dioxide", amount: "3.00" },
    ],
  },
  {
    recipeId: 764965,
    name: "tirasp 14",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Feldespato Potásico", amount: "27.91" },
      { ingredient: "Silica", amount: "25.85" },
      { ingredient: "Whiting", amount: "20.00" },
      { ingredient: "Caolín", amount: "16.36" },
      { ingredient: "Colemanita", amount: "9.88" },
      { ingredient: "Cobalt Oxide", amount: "0.20" },
    ],
  },
  {
    recipeId: 737125,
    name: "Creamy White Matt #5",
    maker: "Tree.Ceramics",
    firingCone: "Cone 5-6",
    recipe: [
      { ingredient: "Potash Feldspar", amount: "29.00" },
      { ingredient: "Silica", amount: "27.00" },
      { ingredient: "Whiting", amount: "21.00" },
      { ingredient: "Kaolin", amount: "17.00" },
      { ingredient: "Colemanite", amount: "10.00" },
      { ingredient: "Tin Oxide", amount: "7.00" },
      { ingredient: "Titanium Dioxide", amount: "2.00" },
    ],
  },
  {
    recipeId: 764974,
    name: "tirasp 18",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Feldespato Potásico", amount: "27.91" },
      { ingredient: "Silica", amount: "25.85" },
      { ingredient: "Whiting", amount: "20.00" },
      { ingredient: "Caolín", amount: "16.36" },
      { ingredient: "Colemanita", amount: "9.88" },
      { ingredient: "Cobalt Oxide", amount: "0.10" },
    ],
  },
  {
    recipeId: 764976,
    name: "tirasp 20",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Feldespato Potásico", amount: "27.91" },
      { ingredient: "Silica", amount: "25.85" },
      { ingredient: "Whiting", amount: "20.00" },
      { ingredient: "Caolín", amount: "16.36" },
      { ingredient: "Colemanita", amount: "9.88" },
      { ingredient: "Cobalt Oxide", amount: "0.30" },
    ],
  },
  {
    recipeId: 764968,
    name: "tirasp 12",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Feldespato Potásico", amount: "27.91" },
      { ingredient: "Silica", amount: "25.85" },
      { ingredient: "Whiting", amount: "20.00" },
      { ingredient: "Caolín", amount: "16.36" },
      { ingredient: "Colemanita", amount: "9.88" },
      { ingredient: "Red Iron Oxide", amount: "3.00" },
    ],
  },
  {
    recipeId: 764969,
    name: "tirasp 3",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Feldespato Potásico Standard Piedra Grande/Dp", amount: "37.21" },
      { ingredient: "Silica", amount: "24.00" },
      { ingredient: "Whiting", amount: "23.31" },
      { ingredient: "Caolín Lote 8 - Piedra Grande", amount: "11.73" },
      { ingredient: "Colemanita calcinada - Testing", amount: "3.73" },
      { ingredient: "Chrome Oxide", amount: "0.20" },
      { ingredient: "Titanium Dioxide", amount: "4.00" },
    ],
  },
  {
    recipeId: 764980,
    name: "tirasp 2",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Feldespato Potásico Standard Piedra Grande/Dp", amount: "28.52" },
      { ingredient: "Silica", amount: "26.55" },
      { ingredient: "Whiting", amount: "24.47" },
      { ingredient: "Caolín Lote 8 - Piedra Grande", amount: "16.75" },
      { ingredient: "Colemanita calcinada - Testing", amount: "3.68" },
      { ingredient: "Chrome Oxide", amount: "0.20" },
      { ingredient: "Titanium Dioxide", amount: "4.00" },
    ],
  },
  {
    recipeId: 764967,
    name: "tirasp 11",
    maker: "Damián",
    firingCone: "Cone 5",
    recipe: [
      { ingredient: "Silica", amount: "28.81" },
      { ingredient: "Whiting", amount: "23.84" },
      { ingredient: "Caolín Lote 8 - Piedra Grande", amount: "21.58" },
      { ingredient: "Feldespato Potásico Standard Piedra Grande/Dp", amount: "19.65" },
      { ingredient: "Colemanita calcinada - Testing", amount: "6.11" },
      { ingredient: "Titanium Dioxide", amount: "4.00" },
      { ingredient: "Chrome Oxide", amount: "0.20" },
    ],
  },
];

export default function VerifyGlazesClient() {
  const [selectedGlaze, setSelectedGlaze] = useState<PendingGlaze | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<number>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<number>>(new Set());
  const [batchSize, setBatchSize] = useState(6);
  const [displayOrder, setDisplayOrder] = useState<PendingGlaze[]>(() => shuffleItems(pendingGlazes));
  const [autoSkipReview, setAutoSkipReview] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("glazeVerifyAutoSkip") === "true";
    if (!stored) return;
    setAutoSkipReview(true);
    setApprovedIds(new Set(pendingGlazes.map((glaze) => glaze.recipeId)));
    setRejectedIds(new Set());
  }, []);

  useEffect(() => {
    window.localStorage.setItem("glazeVerifyAutoSkip", String(autoSkipReview));
    if (!autoSkipReview) return;
    setApprovedIds(new Set(pendingGlazes.map((glaze) => glaze.recipeId)));
    setRejectedIds(new Set());
  }, [autoSkipReview]);

  const handleApprove = (id: number) => {
    setApprovedIds((prev) => new Set(prev).add(id));
    setRejectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleReject = (id: number) => {
    setRejectedIds((prev) => new Set(prev).add(id));
    setApprovedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const approvedCount = approvedIds.size;
  const rejectedCount = rejectedIds.size;
  const pendingCount = pendingGlazes.length - approvedCount - rejectedCount;
  const unreviewedGlazes = displayOrder.filter(
    (glaze) => !approvedIds.has(glaze.recipeId) && !rejectedIds.has(glaze.recipeId),
  );
  const visibleGlazes = unreviewedGlazes.slice(0, batchSize);

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center pt-28 pb-20 px-4">
      <div className="w-full max-w-7xl">
        <div className="mb-6">
          <h1 className="text-5xl font-bold mb-2">Verify New Glazes</h1>
          <p className="text-lg text-[#F2E6C8]/80">
            Review up to {batchSize} recipes at a time from {pendingGlazes.length} total
          </p>
          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-green-300">✓ Approved: {approvedCount}</span>
            <span className="text-red-300">✗ Rejected: {rejectedCount}</span>
            <span className="text-yellow-300">⧗ Pending: {pendingCount}</span>
            <span className="text-[#F2E6C8]/80">Showing: {visibleGlazes.length}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={batchSize}
              onChange={(event) => setBatchSize(Number(event.target.value))}
              className="p-2 rounded-md text-[#F2E6C8] bg-[#3B2A1F] border border-[#F2E6C8]/35 focus:outline-none text-sm"
            >
              <option value={4}>Show 4</option>
              <option value={6}>Show 6</option>
              <option value={8}>Show 8</option>
              <option value={10}>Show 10</option>
            </select>
            <button
              type="button"
              onClick={() => setDisplayOrder(shuffleItems(pendingGlazes))}
              className="py-2 px-3 rounded-md text-sm font-medium bg-[#3B2A1F] border border-[#F2E6C8]/35 hover:bg-[#4B3829]"
            >
              Shuffle Batch
            </button>
            <button
              type="button"
              onClick={() => {
                setApprovedIds(new Set(pendingGlazes.map((glaze) => glaze.recipeId)));
                setRejectedIds(new Set());
              }}
              className="py-2 px-3 rounded-md text-sm font-medium bg-green-700/80 border border-green-300/40 hover:bg-green-700"
            >
              Skip This Batch
            </button>
            <label className="flex items-center gap-2 text-sm text-[#F2E6C8]/90">
              <input
                type="checkbox"
                checked={autoSkipReview}
                onChange={(event) => setAutoSkipReview(event.target.checked)}
              />
              Always auto-skip review
            </label>
          </div>
        </div>

        <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full">
          {visibleGlazes.map((glaze) => {
            const isApproved = approvedIds.has(glaze.recipeId);
            const isRejected = rejectedIds.has(glaze.recipeId);
            let borderColor = "border-[#A44E32]/40";
            let bgOpacity = "bg-[#3B2A1F]/80";

            if (isApproved) {
              borderColor = "border-green-500/60";
              bgOpacity = "bg-[#3B2A1F]/90";
            } else if (isRejected) {
              borderColor = "border-red-500/60";
              bgOpacity = "bg-[#3B2A1F]/50";
            }

            return (
              <article
                key={glaze.recipeId}
                className={`${bgOpacity} rounded-xl shadow-lg border ${borderColor} overflow-hidden transition-all`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold leading-tight">{glaze.name}</h2>
                      <p className="text-xs text-[#F2E6C8]/70 mt-1">
                        by {glaze.maker} • {glaze.firingCone}
                      </p>
                      <p className="text-xs text-[#F2E6C8]/50 mt-1">
                        glazy.org/recipes/{glaze.recipeId}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedGlaze(glaze)}
                    className="text-sm text-[#F2E6C8]/80 hover:text-[#F2E6C8] underline mb-3"
                  >
                    View full recipe ({glaze.recipe.length} ingredients)
                  </button>

                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => handleApprove(glaze.recipeId)}
                      disabled={isApproved}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        isApproved
                          ? "bg-green-600 text-white cursor-default"
                          : "bg-green-600/20 text-green-300 hover:bg-green-600/40"
                      }`}
                    >
                      {isApproved ? "✓ Approved" : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(glaze.recipeId)}
                      disabled={isRejected}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        isRejected
                          ? "bg-red-600 text-white cursor-default"
                          : "bg-red-600/20 text-red-300 hover:bg-red-600/40"
                      }`}
                    >
                      {isRejected ? "✗ Rejected" : "Reject"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {visibleGlazes.length === 0 && (
          <div className="mt-6 rounded-xl border border-[#F2E6C8]/20 bg-[#3B2A1F]/70 p-6 text-sm text-[#F2E6C8]/85">
            No unreviewed recipes left in the current batch. Use <strong>Shuffle Batch</strong> or adjust the batch size.
          </div>
        )}

        {approvedCount > 0 && (
          <div className="mt-8 p-6 bg-[#3B2A1F]/80 rounded-xl border border-green-500/40">
            <h3 className="text-2xl font-bold mb-2">Ready to Import</h3>
            <p className="text-sm text-[#F2E6C8]/80 mb-4">
              {approvedCount} recipe{approvedCount !== 1 ? "s" : ""} approved. Copy the IDs below to add them to your queue:
            </p>
            <div className="bg-[#1a1410] p-4 rounded-md font-mono text-sm text-green-300">
              {Array.from(approvedIds).join(", ")}
            </div>
          </div>
        )}
      </div>

      {selectedGlaze && (
        <div
          className="fixed inset-0 z-50 bg-black/60 px-4 py-8 flex items-center justify-center overflow-y-auto"
          onClick={() => setSelectedGlaze(null)}
        >
          <div
            className="w-full max-w-2xl bg-[#3B2A1F] border border-[#A44E32]/50 rounded-xl shadow-xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-3xl font-semibold">{selectedGlaze.name}</h2>
                  <p className="text-sm text-[#F2E6C8]/70 mt-2">
                    by {selectedGlaze.maker} • {selectedGlaze.firingCone}
                  </p>
                  <a
                    href={`https://glazy.org/recipes/${selectedGlaze.recipeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#F2E6C8]/60 hover:text-[#F2E6C8] underline mt-1 inline-block"
                  >
                    glazy.org/recipes/{selectedGlaze.recipeId} ↗
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGlaze(null)}
                  className="text-3xl leading-none px-3 py-1 rounded-md hover:bg-[#F2E6C8]/10"
                  aria-label="Close recipe detail"
                >
                  ×
                </button>
              </div>

              <div className="mt-5">
                <h3 className="text-xl font-semibold mb-3">Recipe</h3>
                <div className="space-y-2">
                  {selectedGlaze.recipe.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm border-b border-[#F2E6C8]/10 pb-2"
                    >
                      <span>{item.ingredient}</span>
                      <span className="font-semibold">{item.amount}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleApprove(selectedGlaze.recipeId);
                    setSelectedGlaze(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  ✓ Approve Recipe
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleReject(selectedGlaze.recipeId);
                    setSelectedGlaze(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  ✗ Reject Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
