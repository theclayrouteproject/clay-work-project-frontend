import { clays } from "../data";

type Props = { params: { id: string } };

export default function ClayPage({ params }: Props) {
  const id = Number(params.id);
  const clay = clays.find((c) => c.id === id);

  if (!clay) {
    return (
      <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Clay not found</h1>
          <p className="mt-2">No matching clay was found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center pt-28 pb-20 px-4">
      <div className="max-w-4xl w-full bg-[#3B2A1F]/80 rounded-xl shadow-lg border border-[#A44E32]/40 overflow-hidden">
        {clay.img && <img src={clay.img} alt={clay.name} className="w-full h-80 object-cover" />}
        <div className="p-6">
          <h1 className="text-3xl font-bold">{clay.name}</h1>
          {clay.brand && <div className="text-sm text-[#F2E3C7]/80">{clay.brand}</div>}

          <p className="mt-4 text-lg">{clay.description}</p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-[#F2E3C7]/80">Body</div>
              <div className="font-medium mt-1">{clay.body}</div>
            </div>
            <div>
              <div className="text-xs text-[#F2E3C7]/80">Maturation</div>
              <div className="font-medium mt-1">{clay.maturation || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[#F2E3C7]/80">Plasticity</div>
              <div className="font-medium mt-1">{clay.plasticity || "—"}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-[#F2E3C7]/80">Composition</div>
              <div className="mt-1 text-sm">{clay.composition || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[#F2E3C7]/80">Color</div>
              <div className="mt-1 text-sm">{clay.color || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[#F2E3C7]/80">Firing Range</div>
              <div className="mt-1 text-sm">{clay.firingRange || clay.maturation || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[#F2E3C7]/80">Atmosphere</div>
              <div className="mt-1 text-sm">{clay.atmosphere || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[#F2E3C7]/80">Drying Behavior</div>
              <div className="mt-1 text-sm">{clay.dryingBehavior || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[#F2E3C7]/80">Shrinkage</div>
              <div className="mt-1 text-sm">{clay.shrinkageRate || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[#F2E3C7]/80">Absorption</div>
              <div className="mt-1 text-sm">{clay.absorptionRate || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[#F2E3C7]/80">Grog</div>
              <div className="mt-1 text-sm">{clay.grog || "—"}</div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">Studio Workflow</h3>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-[#F2E3C7]/80">Wedging</div>
                <p className="mt-1">{clay.wedgingNotes || "—"}</p>
              </div>
              <div>
                <div className="text-xs text-[#F2E3C7]/80">Throwing</div>
                <p className="mt-1">{clay.throwingNotes || "—"}</p>
              </div>
              <div>
                <div className="text-xs text-[#F2E3C7]/80">Trimming Window</div>
                <p className="mt-1">{clay.trimmingWindow || "—"}</p>
              </div>
              <div>
                <div className="text-xs text-[#F2E3C7]/80">Handbuilding</div>
                <p className="mt-1">{clay.handbuildingNotes || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-[#F2E3C7]/80">Reclaim</div>
                <p className="mt-1">{clay.reclaimNotes || "—"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Best For</h3>
              <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
                {(clay.bestFor ?? []).length > 0 ? (
                  clay.bestFor?.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>—</li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Cautions</h3>
              <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
                {(clay.cautions ?? []).length > 0 ? (
                  clay.cautions?.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>—</li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">Compatible Glazes</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {(clay.compatibleGlazes ?? []).length > 0 ? (
                clay.compatibleGlazes?.map((item) => (
                  <span key={item} className="text-xs bg-[#F2E3C7]/10 text-[#F2E3C7] px-2 py-1 rounded">
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm">—</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
