"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { sources } from "../ceramics101/database/sources";

const toResourceId = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function Resources() {
  const [isResourceDatabaseOpen, setIsResourceDatabaseOpen] = useState(false);

  const resources = [
    {
      title: "Studio Essentials",
      desc: "Recommended tools, kilns, and glazes every ceramicist should know.",
      resourceTitle: "Glazy Help",
    },
    {
      title: "Surface & Glaze Chemistry",
      desc: "A simple breakdown of glaze components — fluxes, stabilizers, and glass‑formers.",
      resourceTitle: "Glazy Help – What Is Glaze?",
    },
    {
      title: "Clay Preparation Guides",
      desc: "From wedging to moisture control, mastering your clay body.",
      resourceTitle: "Glazy Help – What Is Clay?",
    },
    {
      title: "Safety & Studio Care",
      desc: "Keep your workspace safe, clean, and efficient.",
      resourceTitle: "Glazy Help – Safety Guidelines",
    },
  ];

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center pt-28 pb-20 px-4">
      <h1 className="text-5xl font-bold mb-10">Resources</h1>

      <section className="mb-8 max-w-6xl w-full rounded-xl border border-[#F2E6C8]/20 bg-[#4A2F1C]/85 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Source Discovery Admin</h2>
            <p className="text-sm text-[#F2E6C8]/85 mt-1">
              Manual review is currently disabled. Discovery and ingest run automatically in the background.
            </p>
          </div>
          <span className="text-xs px-3 py-1.5 rounded border border-[#F2E6C8]/30 bg-[#F2E6C8]/10 w-fit">
            Auto Mode Active
          </span>
        </div>
      </section>

      <section className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 max-w-6xl w-full">
        {resources.map((r, i) => (
          <motion.div
            key={i}
            className="bg-[#3B2A1F]/80 p-6 rounded-xl border border-[#A44E32]/40 shadow-lg hover:scale-105 transition-transform flex flex-col justify-between"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div>
              <h2 className="text-2xl font-semibold text-[#A44E32] mb-4">{r.title}</h2>
              <p className="text-[#F2E3C7]/90 mb-4">{r.desc}</p>
            </div>
            <Link
              href={`#resource-${toResourceId(r.resourceTitle)}`}
              className="text-[#F2E3C7]/70 text-sm hover:text-[#E6C08B] underline underline-offset-2"
            >
              Learn More →
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="mt-10 bg-[#4A2F1C]/85 border border-[#F2E6C8]/20 rounded-xl p-5 sm:p-6 max-w-6xl w-full">
        <h2 className="text-2xl font-bold">How to Contribute Data</h2>
        <p className="mt-1 text-sm text-[#F2E6C8]/85 max-w-3xl">
          Add new ceramics knowledge or references by editing the JSON data files below.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-[#F2E6C8]">
          <li>• Topics and learning path: <span className="text-[#F2E6C8]/80">app/ceramics101/database/curriculum.data.json</span></li>
          <li>• Searchable expert entries: <span className="text-[#F2E6C8]/80">app/ceramics101/database/knowledge.data.json</span></li>
          <li>• Source references and credits: <span className="text-[#F2E6C8]/80">app/ceramics101/database/sources.data.json</span></li>
        </ul>

        <ol className="mt-4 space-y-1 text-sm text-[#F2E6C8]/90">
          <li>1. Add or update entries in the matching JSON file.</li>
          <li>2. Save and reload <span className="text-[#F2E6C8]">/ceramics101</span> or <span className="text-[#F2E6C8]">/resources</span>.</li>
          <li>3. Run <span className="text-[#F2E6C8]">npm run build</span> before deploy.</li>
        </ol>
      </section>

      <section className="mt-10 bg-[#4A2F1C]/85 border border-[#F2E6C8]/20 rounded-xl p-5 sm:p-6 max-w-6xl w-full">
        <h2 className="text-2xl font-bold">Glazy License Notice</h2>
        <p className="mt-1 text-sm text-[#F2E6C8]/90">
          Creative Commons Attribution–NonCommercial–ShareAlike 4.0 International (CC BY-NC-SA 4.0)
        </p>

        <ul className="mt-4 space-y-2 text-sm text-[#F2E6C8]/90">
          <li>• Attribution: You must credit Glazy and cite the glaze author/contributor.</li>
          <li>• NonCommercial: You cannot use this data for commercial advantage.</li>
          <li>
            • ShareAlike: If you remix, transform, or build upon the material (including creating datasets),
            you must distribute your contributions under the same license.
          </li>
        </ul>

        <p className="mt-3 text-xs text-[#F2E6C8]/80">
          Example attribution format: “Source: Glazy, Glaze: [Glaze Name], Author/Contributor: [Name], Recipe ID: [ID]”.
        </p>
      </section>

      <section className="mt-10 bg-[#4A2F1C]/85 border border-[#F2E6C8]/20 rounded-xl p-5 sm:p-6 max-w-3xl w-full text-center">
        <h2 className="text-2xl font-bold">Resource Database</h2>
        <p className="mt-1 text-sm text-[#F2E6C8]/85">
          Internal Ceramics 101 source records.
        </p>
        <p className="mt-2 text-sm text-[#F2E6C8]/80">{sources.length} sources</p>
        <button
          type="button"
          onClick={() => setIsResourceDatabaseOpen(true)}
          className="mt-4 text-sm px-4 py-2 rounded border border-[#F2E6C8]/30 bg-[#F2E6C8]/10 hover:bg-[#F2E6C8]/20"
        >
          Open Resource Database
        </button>
      </section>

      {isResourceDatabaseOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-xl border border-[#F2E6C8]/20 bg-[#4A2F1C] p-5 sm:p-6 text-center">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold">Resource Database</h3>
              <button
                type="button"
                onClick={() => setIsResourceDatabaseOpen(false)}
                className="text-xs px-3 py-1.5 rounded border border-[#F2E6C8]/30 bg-[#F2E6C8]/10 hover:bg-[#F2E6C8]/20"
              >
                Close
              </button>
            </div>

            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {sources.map((source) => (
                <li key={source.url} className="text-sm rounded border border-[#F2E6C8]/20 bg-[#F2E6C8]/5 p-3">
                  <div className="text-xs px-2 py-0.5 rounded bg-[#F2E6C8]/15 border border-[#F2E6C8]/20 inline-block mb-1">
                    {source.category}
                  </div>
                  <div className="font-medium">{source.title}</div>
                  <div className="text-xs text-[#F2E6C8]/70 mt-0.5 break-all">Original source: {source.url}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </main>
  );
}
