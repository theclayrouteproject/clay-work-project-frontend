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

type GlazeRecipe = {
  name: string;
  amount: number;
  unit?: string;
};

type LiveGlaze = {
  id: string;
  name: string;
  maker: string;
  firingCone: string;
  recipe: GlazeRecipe[];
};

type RecipeItem = {
  ingredient: string;
  amount: string;
};

type VerifyGlaze = {
  recipeId: string;
  name: string;
  maker: string;
  firingCone: string;
  recipe: RecipeItem[];
};

export default function VerifyGlazesClientDynamic() {
  const [glazes, setGlazes] = useState<VerifyGlaze[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [displayOrder, setDisplayOrder] = useState<VerifyGlaze[]>([]);
  const [batchSize, setBatchSize] = useState(6);
  const [autoSkipReview, setAutoSkipReview] = useState(false);
  const [selectedGlaze, setSelectedGlaze] = useState<VerifyGlaze | null>(null);

  // Load glazes from database
  useEffect(() => {
    const loadGlazes = async () => {
      try {
        const response = await fetch('/api/glazes');
        const data = await response.json();

        // Convert to VerifyGlaze format
        const converted: VerifyGlaze[] = (data || []).map((glaze: LiveGlaze) => ({
          recipeId: glaze.id,
          name: glaze.name,
          maker: glaze.maker || 'Unknown',
          firingCone: glaze.firingCone || 'Cone 6',
          recipe: (glaze.recipe || []).map((item: GlazeRecipe) => ({
            ingredient: item.name,
            amount: String(item.amount),
          })),
        }));

        setGlazes(converted);
        setDisplayOrder(shuffleItems(converted));
        setLoading(false);

        // Auto-skip enabled by default - auto-approve all
        setAutoSkipReview(true);
        const allIds = new Set(converted.map((g) => g.recipeId));
        setApprovedIds(allIds);
        localStorage.setItem('glazeVerifyAutoSkip', 'true');
      } catch (error) {
        console.error('Failed to load glazes:', error);
        setLoading(false);
      }
    };

    loadGlazes();
  }, []);

  const unreviewedGlazes = displayOrder.filter(
    (g) => !approvedIds.has(g.recipeId) && !rejectedIds.has(g.recipeId)
  );
  const visibleGlazes = unreviewedGlazes.slice(0, batchSize);

  const handleApprove = (id: string) => {
    const newApproved = new Set(approvedIds);
    newApproved.add(id);
    setApprovedIds(newApproved);
  };

  const handleReject = (id: string) => {
    const newRejected = new Set(rejectedIds);
    newRejected.add(id);
    setRejectedIds(newRejected);
  };

  const handleShuffle = () => {
    setDisplayOrder(shuffleItems(displayOrder));
  };

  const handleAutoSkipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAutoSkipReview(checked);
    localStorage.setItem('glazeVerifyAutoSkip', String(checked));

    if (checked) {
      // Auto-approve all glazes
      const allIds = new Set(glazes.map((g) => g.recipeId));
      setApprovedIds(allIds);
    } else {
      // Clear approvals
      setApprovedIds(new Set());
    }
  };

  const approvalRate = glazes.length > 0 ? Math.round((approvedIds.size / glazes.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading {glazes.length} glazes...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Glaze Verifier</h1>
      <p className="text-gray-600 mb-6">Review and approve glazes before adding to your collection</p>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Batch Size</label>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={4}>4 cards</option>
              <option value={6}>6 cards</option>
              <option value={8}>8 cards</option>
              <option value={10}>10 cards</option>
            </select>
          </div>
          <div className="flex items-end gap-3">
            <button
              onClick={handleShuffle}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              🔀 Shuffle
            </button>
          </div>
        </div>

        {/* Auto-skip toggle */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSkipReview}
              onChange={handleAutoSkipChange}
              className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Auto-approve all glazes</span>
          </label>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{glazes.length}</div>
            <div className="text-xs text-gray-600">Total Glazes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{approvedIds.size}</div>
            <div className="text-xs text-gray-600">Approved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{rejectedIds.size}</div>
            <div className="text-xs text-gray-600">Rejected</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{approvalRate}%</div>
            <div className="text-xs text-gray-600">Progress</div>
          </div>
        </div>
      </div>

      {/* Card Grid */}
      {visibleGlazes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {visibleGlazes.map((glaze) => (
            <div key={glaze.recipeId} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{glaze.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{glaze.maker}</p>
                <p className="text-xs text-gray-500 mb-4">{glaze.firingCone}</p>

                {/* Recipe ingredients preview */}
                <div className="mb-4 p-3 bg-gray-50 rounded max-h-24 overflow-y-auto">
                  <div className="text-xs space-y-1">
                    {glaze.recipe.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-gray-700">
                        <span>{item.ingredient}</span>
                        <span className="font-medium">{item.amount}</span>
                      </div>
                    ))}
                    {glaze.recipe.length > 5 && (
                      <div className="text-gray-500 italic text-center">+{glaze.recipe.length - 5} more</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGlaze(glaze)}
                  className="w-full mb-3 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium"
                >
                  View Recipe
                </button>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleApprove(glaze.recipeId)}
                    className="px-3 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(glaze.recipeId)}
                    className="px-3 py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : autoSkipReview ? (
        <div className="text-center py-16 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-3xl mb-2">✓</div>
          <div className="text-xl font-bold text-green-900 mb-2">All glazes approved!</div>
          <p className="text-sm text-green-700">All {glazes.length} glazes are ready for ingestion.</p>
        </div>
      ) : (
        <div className="text-center py-16 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-lg font-bold text-blue-900 mb-2">Review Complete</div>
          <p className="text-sm text-blue-700">Approved: {approvedIds.size} | Rejected: {rejectedIds.size}</p>
        </div>
      )}

      {/* Modal for full recipe */}
      {selectedGlaze && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedGlaze.name}</h2>
              <button
                onClick={() => setSelectedGlaze(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Maker</p>
                  <p className="font-medium">{selectedGlaze.maker}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Firing Cone</p>
                  <p className="font-medium">{selectedGlaze.firingCone}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900 mb-3">Recipe ({selectedGlaze.recipe.length} ingredients)</p>
                <div className="space-y-2">
                  {selectedGlaze.recipe.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-700">{item.ingredient}</span>
                      <span className="font-medium text-gray-900">{item.amount}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleApprove(selectedGlaze.recipeId);
                    setSelectedGlaze(null);
                  }}
                  className="px-4 py-3 bg-green-500 text-white rounded font-medium hover:bg-green-600"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => {
                    handleReject(selectedGlaze.recipeId);
                    setSelectedGlaze(null);
                  }}
                  className="px-4 py-3 bg-red-500 text-white rounded font-medium hover:bg-red-600"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
