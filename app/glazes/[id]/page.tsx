import { promises as fs } from "node:fs";
import path from "node:path";
import type { Glaze } from "../data";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

async function loadGlazes(): Promise<Glaze[]> {
  try {
    const filePath = path.join(process.cwd(), "app", "glazes", "database", "glazes.data.json");
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as Glaze[];
  } catch {
    return [];
  }
}

export default async function GlazePage({ params }: Props) {
  const { id } = await params;
  const glazes = await loadGlazes();
  const normalizedId = decodeURIComponent(id);
  const g = glazes.find((x) => x.id === normalizedId && x.available !== false);
  const logoFallback = "/TCRP%20Logo_2.png";

  if (!g) {
    return (
      <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Glaze not found</h1>
          <p className="mt-2">We couldn't find that glaze.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center pt-28 pb-20 px-4">
      <div className="max-w-4xl w-full bg-[#3B2A1F]/80 rounded-xl shadow-lg border border-[#A44E32]/40 overflow-hidden">
        <img src={g.img || logoFallback} alt={g.name} className="w-full h-96 object-cover" />
        <div className="p-6">
          <h1 className="text-4xl font-bold">{g.name}</h1>
          <p className="mt-3 text-lg">{g.description}</p>

          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <span className="text-sm px-3 py-1 bg-[#A44E32]/20 rounded">{g.finish}</span>
            <span className="text-sm px-3 py-1 bg-[#F2E3C7]/10 rounded">{g.color}</span>
            <span className="text-sm px-3 py-1 bg-[#F2E3C7]/10 rounded">{g.firingCone}</span>
          </div>

          <div className="mt-5">
            <h2 className="text-xl font-semibold">Core Ingredients</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {g.ingredients.map((ingredient) => (
                <span key={ingredient} className="text-xs bg-[#F2E3C7]/10 text-[#F2E3C7] px-2 py-1 rounded">
                  {ingredient}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm text-[#F2E6C8]/80">
            Source: {g.sourceLabel} • Internal reference: {g.sourceRef}
          </p>

          <p className="mt-1 text-sm text-[#F2E6C8]/80">Maker: {g.maker || g.sourceLabel}</p>

          <p className="mt-2 text-sm text-[#F2E6C8]/75">
            This library is curated in-app and expanded over time using non-linked Glazy source references.
          </p>

          <p className="mt-2 text-xs text-[#F2E6C8]/70">
            Attribution example: Source: Glazy, Glaze: {g.name}, Author/Contributor: {g.sourceLabel}, Recipe ID: {g.sourceRef}
          </p>
        </div>
      </div>
    </main>
  );
}
