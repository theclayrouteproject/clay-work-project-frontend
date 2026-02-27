"use client";

import { useMemo, useState } from "react";
import type { Glaze } from "./data";

type Props = {
  data: Glaze[];
};

export default function GlazesClient({ data }: Props) {
  const [query, setQuery] = useState("");
  const [finish, setFinish] = useState("all");
  const [color, setColor] = useState("all");
  const [cone, setCone] = useState("all");
  const [ingredient, setIngredient] = useState("all");
  const [selectedGlaze, setSelectedGlaze] = useState<Glaze | null>(null);
  const logoFallback = "/TCRP%20Logo_2.png";

  const measuredRecipe = (g: Glaze) => (Array.isArray(g.recipe) ? g.recipe : []);

  const hasVariationRecipes = (g: Glaze) =>
    Array.isArray(g.variations) && g.variations.some((variation) => Array.isArray(variation.recipe) && variation.recipe.length > 0);

  const finishes = useMemo(() => ["all", ...Array.from(new Set(data.map((g) => g.finish))).sort()], [data]);
  const colors = useMemo(() => ["all", ...Array.from(new Set(data.map((g) => g.color))).sort()], [data]);
  const cones = useMemo(() => ["all", ...Array.from(new Set(data.map((g) => g.firingCone))).sort()], [data]);
  const ingredients = useMemo(
    () => ["all", ...Array.from(new Set(data.flatMap((g) => g.ingredients))).sort()],
    [data],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((g) => {
      const matchesQuery =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.finish.toLowerCase().includes(q) ||
        g.color.toLowerCase().includes(q) ||
        g.ingredients.some((item) => item.toLowerCase().includes(q));

      const matchesFinish = finish === "all" || g.finish === finish;
      const matchesColor = color === "all" || g.color === color;
      const matchesCone = cone === "all" || g.firingCone === cone;
      const matchesIngredient = ingredient === "all" || g.ingredients.includes(ingredient);

      return matchesQuery && matchesFinish && matchesColor && matchesCone && matchesIngredient;
    });
  }, [data, query, finish, color, cone, ingredient]);

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center pt-28 pb-20 px-4">
      <div className="w-full max-w-7xl">
        <h1 className="text-5xl font-bold mb-4">Glazes</h1>

        <div className="mb-4 flex gap-3 items-center">
          <input
            aria-label="Search glazes"
            placeholder="Search glazes, finishes, colors, ingredients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-3 rounded-md text-[#3B2A1F] focus:outline-none"
          />
          <div className="text-sm text-[#F2E3C7]/80">{filtered.length} results</div>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={finish} onChange={(e) => setFinish(e.target.value)} className="p-3 rounded-md text-[#F2E6C8] bg-[#3B2A1F] border border-[#F2E6C8]/35 focus:outline-none">
            {finishes.map((option) => (
              <option key={option} value={option}>{option === "all" ? "All finishes" : option}</option>
            ))}
          </select>

          <select value={color} onChange={(e) => setColor(e.target.value)} className="p-3 rounded-md text-[#F2E6C8] bg-[#3B2A1F] border border-[#F2E6C8]/35 focus:outline-none">
            {colors.map((option) => (
              <option key={option} value={option}>{option === "all" ? "All colors" : option}</option>
            ))}
          </select>

          <select value={ingredient} onChange={(e) => setIngredient(e.target.value)} className="p-3 rounded-md text-[#F2E6C8] bg-[#3B2A1F] border border-[#F2E6C8]/35 focus:outline-none">
            {ingredients.map((option) => (
              <option key={option} value={option}>{option === "all" ? "All ingredients" : option}</option>
            ))}
          </select>

          <select value={cone} onChange={(e) => setCone(e.target.value)} className="p-3 rounded-md text-[#F2E6C8] bg-[#3B2A1F] border border-[#F2E6C8]/35 focus:outline-none">
            {cones.map((option) => (
              <option key={option} value={option}>{option === "all" ? "All firing cones" : option}</option>
            ))}
          </select>
        </div>

        <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full">
          {filtered.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGlaze(g)}
              className="block text-left"
            >
              <article className="bg-[#3B2A1F]/80 rounded-xl shadow-lg border border-[#A44E32]/40 overflow-hidden hover:scale-[1.01] transition-transform">
                <img
                  src={g.img || logoFallback}
                  alt={g.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = logoFallback;
                  }}
                />
                <div className="p-4">
                  <h2 className="text-2xl font-semibold">{g.name}</h2>
                  <p className="mt-2 text-sm">{g.description}</p>
                  <p className="mt-2 text-xs text-[#F2E6C8]/80">Maker: {g.maker || g.sourceLabel}</p>

                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <span className="text-xs bg-[#A44E32]/20 text-[#F2E3C7] px-2 py-1 rounded">{g.finish}</span>
                    <span className="text-xs bg-[#F2E3C7]/10 text-[#F2E3C7] px-2 py-1 rounded">{g.color}</span>
                    <span className="text-xs bg-[#F2E3C7]/10 text-[#F2E3C7] px-2 py-1 rounded">{g.firingCone}</span>
                  </div>
                </div>
              </article>
            </button>
          ))}
        </section>
      </div>

      {selectedGlaze ? (
        <div
          className="fixed inset-0 z-60 bg-black/60 px-4 py-8 flex items-center justify-center"
          onClick={() => setSelectedGlaze(null)}
        >
          <div
            className="w-full max-w-2xl bg-[#3B2A1F] border border-[#A44E32]/50 rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedGlaze.img || logoFallback}
              alt={selectedGlaze.name}
              className="w-full h-64 object-cover"
              onError={(e) => {
                e.currentTarget.src = logoFallback;
              }}
            />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-3xl font-semibold">{selectedGlaze.name}</h2>
                <button
                  type="button"
                  onClick={() => setSelectedGlaze(null)}
                  className="text-2xl leading-none px-2 py-1 rounded-md hover:bg-[#F2E6C8]/10"
                  aria-label="Close recipe card"
                >
                  ×
                </button>
              </div>

              <p className="mt-3 text-sm">{selectedGlaze.description}</p>

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className="text-xs bg-[#A44E32]/20 text-[#F2E3C7] px-2 py-1 rounded">{selectedGlaze.finish}</span>
                <span className="text-xs bg-[#F2E3C7]/10 text-[#F2E3C7] px-2 py-1 rounded">{selectedGlaze.color}</span>
                <span className="text-xs bg-[#F2E3C7]/10 text-[#F2E3C7] px-2 py-1 rounded">{selectedGlaze.firingCone}</span>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold">Recipe Ingredients</h3>
                <div className="mt-2">
                  {measuredRecipe(selectedGlaze).length > 0 ? (
                    <div className="space-y-2">
                      {measuredRecipe(selectedGlaze).map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm border-b border-[#F2E6C8]/10 pb-1">
                          <span>{item.name}</span>
                          <span className="font-semibold">
                            {item.amount}
                            {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : Array.isArray(selectedGlaze.ingredients) && selectedGlaze.ingredients.length > 0 ? (
                    <div className="space-y-2">
                      {selectedGlaze.ingredients.map((ingredientName) => (
                        <div key={ingredientName} className="text-sm border-b border-[#F2E6C8]/10 pb-1">
                          {ingredientName}
                        </div>
                      ))}
                    </div>
                  ) : hasVariationRecipes(selectedGlaze) ? (
                    <span className="text-sm text-[#F2E6C8]/80">Base recipe is not listed. See measured variation recipes below.</span>
                  ) : (
                    <span className="text-sm text-[#F2E6C8]/80">Recipe ingredient details are not available yet.</span>
                  )}
                </div>
              </div>

              {hasVariationRecipes(selectedGlaze) ? (
                <div className="mt-5">
                  <h3 className="text-lg font-semibold">Recipe Variations</h3>
                  <div className="mt-2 space-y-4">
                    {selectedGlaze.variations?.map((variation) => {
                      if (!Array.isArray(variation.recipe) || variation.recipe.length === 0) {
                        return null;
                      }

                      return (
                        <div key={variation.name} className="border border-[#F2E6C8]/15 rounded-lg p-3">
                          <p className="text-sm font-semibold">{variation.name}</p>
                          {variation.notes ? <p className="mt-1 text-xs text-[#F2E6C8]/75">{variation.notes}</p> : null}

                          <div className="mt-2 space-y-2">
                            {variation.recipe.map((item) => (
                              <div key={`${variation.name}-${item.name}`} className="flex items-center justify-between text-sm border-b border-[#F2E6C8]/10 pb-1">
                                <span>{item.name}</span>
                                <span className="font-semibold">
                                  {item.amount}
                                  {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <p className="mt-4 text-sm text-[#F2E6C8]/85">Maker: {selectedGlaze.maker || selectedGlaze.sourceLabel}</p>
              <p className="mt-1 text-sm text-[#F2E6C8]/80">
                Source: {selectedGlaze.sourceLabel} • Reference: {selectedGlaze.sourceRef}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
