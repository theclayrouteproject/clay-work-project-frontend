"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { clays as data, Clay } from "./data";

export default function Clays() {
  const [query, setQuery] = useState("");
  const [filterBody, setFilterBody] = useState<string>("all");

  const bodies = useMemo(() => {
    const set = new Set<string>(data.map((c) => c.body));
    return ["all", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((c) => {
      if (filterBody !== "all" && c.body !== filterBody) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.brand || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      );
    });
  }, [query, filterBody]);

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center pt-28 pb-20 px-4">
      <div className="w-full max-w-7xl">
        <h1 className="text-5xl font-bold mb-4">Clays</h1>

        <div className="mb-6 flex flex-col sm:flex-row gap-3 items-center">
          <input
            aria-label="Search clays"
            placeholder="Search by name, brand, or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-3 rounded-md text-[#3B2A1F] focus:outline-none"
          />

          <select
            value={filterBody}
            onChange={(e) => setFilterBody(e.target.value)}
            className="p-3 rounded-md text-[#F2E6C8] bg-[#3B2A1F] border border-[#F2E6C8]/35 focus:outline-none"
            aria-label="Filter by body"
          >
            {bodies.map((b) => (
              <option key={b} value={b}>
                {b === "all" ? "All bodies" : b}
              </option>
            ))}
          </select>

          <div className="text-sm text-[#F2E3C7]/80">{filtered.length} results</div>
        </div>

        <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full">
          {filtered.map((c: Clay) => (
            <Link key={c.id} href={`/clays/${c.id}`} className="block">
              <article className="bg-[#3B2A1F]/80 rounded-xl shadow-lg border border-[#A44E32]/40 overflow-hidden hover:scale-[1.01] transition-transform">
                <img src={c.img} alt={c.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h2 className="text-2xl font-semibold">{c.name}</h2>
                  <div className="mt-1 text-sm text-[#F2E3C7]/80">{c.brand}</div>
                  <p className="mt-2 text-sm">{c.description}</p>

                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <span className="text-xs bg-[#A44E32]/20 text-[#F2E3C7] px-2 py-1 rounded">{c.body}</span>
                    {c.maturation && (
                      <span className="text-xs bg-[#F2E3C7]/10 text-[#F2E3C7] px-2 py-1 rounded">{c.maturation}</span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
