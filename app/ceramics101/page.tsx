"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  compiledKnowledge,
  curriculum,
  levels,
  sources,
  topicSources,
  type Level,
} from "./database/index";

const coneHistory = [
  {
    period: "1782",
    note: "Josiah Wedgwood publishes an early pyrometric approach for measuring kiln heat.",
  },
  {
    period: "1886",
    note: "Hermann Seger develops the modern cone system for porcelain control in Berlin.",
  },
  {
    period: "1896",
    note: "Edward Orton Jr. begins manufacturing standardized cones in the U.S.",
  },
  {
    period: "Today",
    note: "Cones remain the practical standard for checking real heatwork in electric, gas, and wood kilns.",
  },
];

const coneTemperatureChart = [
  { cone: "022", c: "586–590°C", f: "1087–1094°F", zone: "Very low / decals-luster" },
  { cone: "010", c: "891–915°C", f: "1636–1679°F", zone: "Low bisque / early low-fire" },
  { cone: "06", c: "981–1013°C", f: "1798–1855°F", zone: "Low fire (earthenware)" },
  { cone: "04", c: "1046–1077°C", f: "1915–1971°F", zone: "Low fire mature earthenware" },
  { cone: "02", c: "1078–1122°C", f: "1972–2052°F", zone: "Hot low-fire / transition" },
  { cone: "1", c: "1109–1154°C", f: "2028–2109°F", zone: "Low-mid transition" },
  { cone: "5", c: "1159–1207°C", f: "2118–2205°F", zone: "Mid fire" },
  { cone: "6", c: "1185–1243°C", f: "2165–2269°F", zone: "Common studio mid fire" },
  { cone: "8", c: "1211–1271°C", f: "2212–2320°F", zone: "High-mid / high" },
  { cone: "10", c: "1251–1305°C", f: "2284–2381°F", zone: "High fire stoneware/porcelain" },
  { cone: "12", c: "1285–1326°C", f: "2345–2419°F", zone: "Very high fire" },
];

const coneEffectsChart = [
  {
    range: "022–010",
    firing: "Luster/overglaze or low bisque",
    clay: "Little vitrification; bodies stay porous and fragile.",
    glaze: "Overglaze enamels and lusters can fuse without remelting base glaze.",
  },
  {
    range: "06–04",
    firing: "Low-fire glaze / earthenware",
    clay: "Earthenware matures but remains porous unless well glazed.",
    glaze: "Bright color response, glossy low-temp glazes, often higher expansion risk.",
  },
  {
    range: "03–1",
    firing: "Hot low-fire to transition",
    clay: "Some bodies begin stronger sintering; overfiring risk for low-fire clay.",
    glaze: "Some low-fire glazes run; mid-fire glazes often still under-melted.",
  },
  {
    range: "5–6",
    firing: "Mid-fire stoneware",
    clay: "Many stoneware bodies reach functional maturity and lower absorption.",
    glaze: "Large recipe ecosystem, stable functional glazes with broad color range.",
  },
  {
    range: "7–8",
    firing: "High-mid to high",
    clay: "Further densification; some mid-fire bodies may begin to deform.",
    glaze: "More complete melting, potential for increased movement and crystal shifts.",
  },
  {
    range: "9–12",
    firing: "High fire",
    clay: "Stoneware/porcelain can vitrify strongly; wrong body may bloat or slump.",
    glaze: "Durable high-fire surfaces; atmosphere and cooling strongly affect final look.",
  },
];

const browseLevels: Array<"All" | Level> = [
  "All",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Master",
];

const browseSections: Array<{
  title: string;
  desc: string;
  level: Level;
  urls: string[];
}> = [
  {
    title: "Start Here",
    desc: "Foundational concepts for complete beginners.",
    level: "Beginner",
    urls: [
      "https://help.glazy.org/concepts/clay",
      "https://help.glazy.org/concepts/glaze",
      "https://en.wikipedia.org/wiki/Pottery",
    ],
  },
  {
    title: "Firing & Heatwork",
    desc: "Kiln process, cones, and temperature control.",
    level: "Intermediate",
    urls: [
      "https://help.glazy.org/concepts/firing",
      "https://help.glazy.org/concepts/temperature",
      "https://en.wikipedia.org/wiki/Pyrometric_cone",
      "https://www.ortonceramic.com/",
    ],
  },
  {
    title: "Glaze Defects & Testing",
    desc: "Troubleshooting and practical glaze development.",
    level: "Advanced",
    urls: [
      "https://help.glazy.org/concepts/defects",
      "https://help.glazy.org/testing/mixing-tests",
      "https://digitalfire.com/",
      "https://ceramicartsnetwork.org/",
    ],
  },
  {
    title: "Clay Bodies & Materials",
    desc: "Body composition, vitrification, and material behavior.",
    level: "Intermediate",
    urls: [
      "https://en.wikipedia.org/wiki/Clay",
      "https://en.wikipedia.org/wiki/Stoneware",
      "https://en.wikipedia.org/wiki/Porcelain",
      "https://en.wikipedia.org/wiki/Vitrification",
    ],
  },
  {
    title: "Academic & Research",
    desc: "University-level ceramics and engineering programs.",
    level: "Master",
    urls: [
      "https://www.alfred.edu/academics/colleges-schools/new-york-state-college-ceramics/",
      "https://www.alfred.edu/academics/graduate-programs/ceramic-art/",
      "https://www.alfred.edu/academics/undergraduate-majors-minors/ceramic-engineering/",
      "https://www.rca.ac.uk/study/programme-finder/ceramics-glass-ma/",
      "https://ceramics.org/",
    ],
  },
];

const toResourceId = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatBrowseLabel = (title: string) => {
  return title
    .replace(/^Glazy Help\s+–\s+/, "")
    .replace(/^Glazy Wiki\s+–\s+/, "")
    .replace(/\s+\(Wikipedia\)$/i, "")
    .replace(/\s+\(Archived\)$/i, "")
    .trim();
};

export default function Ceramics101Page() {
  const [query, setQuery] = useState("");
  const [activeLevel, setActiveLevel] = useState<Level>("Beginner");
  const [activeBrowseLevel, setActiveBrowseLevel] = useState<"All" | Level>("All");
  const [activeBrowseUrl, setActiveBrowseUrl] = useState<string | null>(null);
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);
  const [activeKnowledgeId, setActiveKnowledgeId] = useState<string | null>(null);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const q = normalizedQuery;

    return curriculum.filter((topic) => {
      if (topic.level !== activeLevel) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        topic.title,
        topic.summary,
        topic.level,
        topic.keywords.join(" "),
        topic.steps.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [normalizedQuery, activeLevel]);

  const sourceLookup = useMemo(() => {
    return Object.fromEntries(sources.map((source) => [source.url, source]));
  }, []);

  const curriculumKnowledgeEntries = useMemo(() => {
    return curriculum.map((topic) => ({
      id: `topic-${topic.id}`,
      level: topic.level,
      title: topic.title,
      category: "Curriculum Topic",
      summary: topic.summary,
      details: topic.steps,
      keywords: topic.keywords,
      sourceLabels: (topicSources[topic.id] ?? [])
        .map((url) => sourceLookup[url]?.title)
        .filter((title): title is string => Boolean(title)),
    }));
  }, [sourceLookup]);

  const searchableKnowledge = useMemo(() => {
    return [...compiledKnowledge, ...curriculumKnowledgeEntries];
  }, [curriculumKnowledgeEntries]);

  const knowledgeResults = useMemo(() => {
    if (!normalizedQuery) return [];

    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return searchableKnowledge.filter((entry) => {
      const haystack = [
        entry.level,
        entry.title,
        entry.category,
        entry.summary,
        entry.details.join(" "),
        entry.keywords.join(" "),
        entry.sourceLabels.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return queryTokens.every((token) => haystack.includes(token));
    });
  }, [normalizedQuery, searchableKnowledge]);

  const activeKnowledge = useMemo(() => {
    if (knowledgeResults.length === 0) return null;

    return knowledgeResults.find((entry) => entry.id === activeKnowledgeId) ?? knowledgeResults[0];
  }, [knowledgeResults, activeKnowledgeId]);

  useEffect(() => {
    if (!normalizedQuery || knowledgeResults.length === 0) {
      return;
    }

    setActiveKnowledgeId((current) => {
      if (current && knowledgeResults.some((entry) => entry.id === current)) {
        return current;
      }

      return knowledgeResults[0].id;
    });
  }, [normalizedQuery, knowledgeResults]);

  const grouped = useMemo(() => {
    return levels.map((level) => ({
      level,
      topics: filtered.filter((topic) => topic.level === level),
    }));
  }, [filtered]);

  const filteredBrowseSections = useMemo(() => {
    return browseSections.filter(
      (section) => activeBrowseLevel === "All" || section.level === activeBrowseLevel,
    );
  }, [activeBrowseLevel]);

  const browseModalUrls = useMemo(() => {
    return Array.from(new Set(filteredBrowseSections.flatMap((section) => section.urls)));
  }, [filteredBrowseSections]);

  const activeBrowseIndex = useMemo(() => {
    if (!activeBrowseUrl) return -1;
    return browseModalUrls.indexOf(activeBrowseUrl);
  }, [activeBrowseUrl, browseModalUrls]);

  const activeBrowseSource = useMemo(() => {
    if (!activeBrowseUrl) return null;
    return sourceLookup[activeBrowseUrl] ?? null;
  }, [activeBrowseUrl, sourceLookup]);

  const activeBrowseKnowledge = useMemo(() => {
    if (!activeBrowseSource) return [];

    return searchableKnowledge.filter((entry) =>
      entry.sourceLabels.some((label) => label === activeBrowseSource.title),
    );
  }, [activeBrowseSource, searchableKnowledge]);

  const activeBrowseTopics = useMemo(() => {
    if (!activeBrowseUrl) return [];

    return curriculum.filter((topic) => (topicSources[topic.id] ?? []).includes(activeBrowseUrl));
  }, [activeBrowseUrl]);

  const firstTopicResultId = useMemo(() => {
    if (filtered.length === 0) return null;
    return `topic-${filtered[0].id}`;
  }, [filtered]);

  const handleSearchEnter = () => {
    if (knowledgeResults.length > 0) {
      const firstKnowledgeId = knowledgeResults[0].id;
      setActiveKnowledgeId(firstKnowledgeId);
      setIsKnowledgeModalOpen(true);
      return;
    }

    setIsKnowledgeModalOpen(false);

    if (!firstTopicResultId) return;

    const firstTopicElement = document.getElementById(firstTopicResultId);
    if (firstTopicElement) {
      firstTopicElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const activeBrowseSections = useMemo(() => {
    if (!activeBrowseUrl) return [];

    return browseSections.filter((section) => section.urls.includes(activeBrowseUrl));
  }, [activeBrowseUrl]);

  useEffect(() => {
    if (!isKnowledgeModalOpen && !isBrowseModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsKnowledgeModalOpen(false);
        setIsBrowseModalOpen(false);
        return;
      }

      if (!isBrowseModalOpen) return;

      if (event.key === "ArrowLeft" && activeBrowseIndex > 0) {
        setActiveBrowseUrl(browseModalUrls[activeBrowseIndex - 1]);
      }

      if (event.key === "ArrowRight" && activeBrowseIndex >= 0 && activeBrowseIndex < browseModalUrls.length - 1) {
        setActiveBrowseUrl(browseModalUrls[activeBrowseIndex + 1]);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isKnowledgeModalOpen, isBrowseModalOpen, activeBrowseIndex, browseModalUrls]);

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] pt-36 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <Image
              src="/TCRP%20Logo_2.png"
              alt="The Clay Route Project logo"
              width={258}
              height={258}
              className="rounded-sm logo-trim-edge"
              priority
            />
            <h1 className="text-4xl sm:text-5xl font-bold">Ceramics 101</h1>
          </div>
          <p className="mt-3 text-base sm:text-lg text-[#F2E6C8] max-w-3xl mx-auto text-center bg-[#3B2A1F] border border-[#A44E32]/40 rounded-lg px-4 py-3">
            A complete learning path from first pinch pot to advanced studio mastery. Use search to find any ceramics or pottery topic instantly, then navigate by level.
          </p>
        </header>

        <section className="bg-[#4A2F1C]/85 border border-[#F2E6C8]/20 rounded-xl p-4 sm:p-5 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearchEnter();
                }
              }}
              placeholder="Search topics or knowledge: raku firing, cone 6, oxidation, cracking, porcelain..."
              aria-label="Search ceramics topics"
              className="w-full lg:flex-1 p-3 rounded-md text-[#556B2F] bg-[#F2E6C8] placeholder:text-[#556B2F]/70 focus:outline-none"
            />

            <div className="text-sm text-[#F2E6C8]/80 whitespace-nowrap">
              {filtered.length} topics found{normalizedQuery ? ` • ${knowledgeResults.length} knowledge matches` : ""}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                  activeLevel === level
                    ? "bg-[#F2E6C8] text-[#556B2F] border-[#F2E6C8]"
                    : "bg-transparent text-[#F2E6C8] border-[#F2E6C8]/40 hover:bg-[#4A2F1C]"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {normalizedQuery ? (
            <div className="mt-4 border-t border-[#F2E6C8]/20 pt-4">
              {knowledgeResults.length === 0 ? (
                <p className="text-sm text-[#F2E6C8]/85">
                  No deep reference match yet. Try terms like "raku", "oxidation", "crawling", "cone 6", or "porcelain".
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-medium text-[#F2E6C8]">Knowledge matches</p>
                    <span className="text-xs text-[#F2E6C8]/80">Tap to open popout</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {knowledgeResults.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => {
                          setActiveKnowledgeId(entry.id);
                          setIsKnowledgeModalOpen(true);
                        }}
                        className={`text-xs px-2.5 py-1 rounded border transition-all ${
                          activeKnowledge?.id === entry.id
                            ? "bg-[#F2E6C8] text-[#556B2F] border-[#F2E6C8]"
                            : "bg-[#F2E6C8]/10 text-[#F2E6C8] border-[#F2E6C8]/30 hover:bg-[#F2E6C8]/20"
                        }`}
                      >
                        {entry.level} • {entry.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </section>

        <section className="bg-[#4A2F1C]/85 border border-[#F2E6C8]/20 rounded-xl p-5 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Browse by Topic</h2>
              <p className="mt-1 text-sm text-[#F2E6C8]/85 max-w-3xl">
                Don’t know what to search? Start from a topic and explore curated references.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {browseLevels.map((level) => {
              const isActive = activeBrowseLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setActiveBrowseLevel(level)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    isActive
                      ? "bg-[#A44E32] text-[#F2E6C8] border-[#A44E32]"
                      : "bg-[#F2E6C8]/10 text-[#F2E6C8] border-[#F2E6C8]/30 hover:bg-[#F2E6C8]/20"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBrowseSections.map((section) => (
              <div
                key={section.title}
                className="rounded-lg border border-[#F2E6C8]/20 bg-[#3B2A1F]/65 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-[#F2E6C8]">{section.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#F2E6C8]/15 border border-[#F2E6C8]/20 text-[#F2E6C8]">
                    {section.level}
                  </span>
                </div>
                <p className="text-sm text-[#F2E6C8]/80 mt-1">{section.desc}</p>
                <ul className="mt-3 space-y-2">
                  {section.urls.map((url) => {
                    const source = sourceLookup[url];

                    return (
                      <li key={url}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBrowseUrl(url);
                            setIsBrowseModalOpen(true);
                          }}
                          className="text-sm text-[#F2E6C8] hover:text-[#E6C08B] underline underline-offset-2"
                        >
                          {source ? formatBrowseLabel(source.title) : "View in Resources"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {filtered.length === 0 && knowledgeResults.length === 0 ? (
          <section className="bg-[#556B2F]/70 border border-[#F2E6C8]/20 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-semibold">No topics match your search</h2>
            <p className="mt-2 text-[#F2E6C8]/85">
              Try broader terms like "glaze", "kiln", "throwing", or choose a different level.
            </p>
          </section>
        ) : (
          <div className="space-y-10">
            {grouped.map(({ level, topics }) => {
              if (topics.length === 0) return null;

              return (
                <section key={level} id={level.toLowerCase()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold">{level}</h2>
                    <span className="text-sm text-[#F2E6C8]/80">{topics.length} topics</span>
                  </div>

                  <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                    {topics.map((topic) => (
                      <article
                        key={topic.id}
                        id={`topic-${topic.id}`}
                        className="bg-[#4A2F1C]/85 border border-[#F2E6C8]/20 rounded-xl p-5"
                      >
                        <h3 className="text-xl font-semibold">{topic.title}</h3>
                        <p className="mt-2 text-[#F2E6C8]/90">{topic.summary}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {topic.keywords.slice(0, 4).map((keyword) => (
                            <span
                              key={keyword}
                              className="text-xs px-2 py-1 rounded bg-[#F2E6C8]/15 border border-[#F2E6C8]/20"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>

                        <ol className="mt-4 space-y-2 list-decimal pl-5 text-sm text-[#F2E6C8]/95">
                          {topic.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>

                        <div className="mt-4 pt-3 border-t border-[#F2E6C8]/20">
                          <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75">
                            Sources for this topic
                          </p>
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {(topicSources[topic.id] ?? []).map((url) => {
                              const source = sourceLookup[url];
                              if (!source) return null;

                              return (
                                <li key={`${topic.id}-${url}`}>
                                  <span className="text-xs px-2 py-1 rounded border border-[#F2E6C8]/25 bg-[#F2E6C8]/10 text-[#F2E6C8]">
                                    {source.title}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <section className="mt-10 bg-[#4A2F1C]/85 border border-[#F2E6C8]/20 rounded-xl p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Cone Guide: History, Use, and Practical Charts</h2>
          <p className="mt-2 text-sm text-[#F2E6C8]/90 max-w-4xl">
            Cones measure <strong>heatwork</strong> (time + temperature), not just raw peak temperature. This is why
            two firings can reach similar cone results at different top temperatures if their soak and ramp differ.
          </p>

          <div className="mt-4 rounded-lg border border-[#F2E6C8]/30 bg-[#F2E6C8]/10 p-4 print:bg-white print:text-black">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">Quick Cone Cheat Sheet</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#F2E6C8]/80 print:text-black/70">Print-friendly snapshot</span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="print:hidden text-xs px-2.5 py-1 rounded border border-[#F2E6C8]/30 bg-[#F2E6C8]/15 hover:bg-[#F2E6C8]/25"
                >
                  Print this section
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75 print:text-black/70">Most used ranges</p>
                <ul className="mt-1 text-sm space-y-1">
                  <li><strong>06–04:</strong> low-fire earthenware</li>
                  <li><strong>5–6:</strong> mid-fire stoneware (common studio range)</li>
                  <li><strong>9–10:</strong> high-fire stoneware/porcelain</li>
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75 print:text-black/70">Three-cone pack</p>
                <ul className="mt-1 text-sm space-y-1">
                  <li><strong>Guide:</strong> 1 cone cooler than target</li>
                  <li><strong>Firing:</strong> target cone for maturity</li>
                  <li><strong>Guard:</strong> 1 cone hotter to catch overfire</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-left border-b border-[#F2E6C8]/25 print:border-black/20">
                    <th className="py-1 pr-3">Cone</th>
                    <th className="py-1 pr-3">Approx °C</th>
                    <th className="py-1 pr-3">Approx °F</th>
                    <th className="py-1">Typical outcome</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#F2E6C8]/10 print:border-black/15">
                    <td className="py-1 pr-3 font-medium">06</td>
                    <td className="py-1 pr-3">981–1013</td>
                    <td className="py-1 pr-3">1798–1855</td>
                    <td className="py-1">Low-fire glaze maturity</td>
                  </tr>
                  <tr className="border-b border-[#F2E6C8]/10 print:border-black/15">
                    <td className="py-1 pr-3 font-medium">6</td>
                    <td className="py-1 pr-3">1185–1243</td>
                    <td className="py-1 pr-3">2165–2269</td>
                    <td className="py-1">Mid-fire functional stoneware</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 font-medium">10</td>
                    <td className="py-1 pr-3">1251–1305</td>
                    <td className="py-1 pr-3">2284–2381</td>
                    <td className="py-1">High-fire vitrification and glaze maturity</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {coneHistory.map((item) => (
              <div key={item.period} className="rounded-lg border border-[#F2E6C8]/20 bg-[#F2E6C8]/10 p-3">
                <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75">{item.period}</p>
                <p className="mt-1 text-sm text-[#F2E6C8]">{item.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">How potters use cones in real firings</h3>
            <ol className="mt-2 list-decimal pl-5 text-sm space-y-1 text-[#F2E6C8]/95">
              <li>Set a 3-cone pack: guide cone (cooler), firing cone (target), guard cone (hotter).</li>
              <li>Place packs on top, middle, and bottom shelves to reveal kiln hot/cool zones.</li>
              <li>At shutoff, firing cone should be near 5–6 o’clock bend for target maturity.</li>
              <li>If guide is still standing, you underfired; if guard is down, you likely overfired.</li>
              <li>Log cone results with glaze/clay outcomes and adjust schedule one variable at a time.</li>
            </ol>
          </div>

          <div className="mt-6 overflow-x-auto">
            <h3 className="text-lg font-semibold mb-2">Chart 1: Cone to temperature (easy reference)</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-[#F2E6C8]/25">
                  <th className="py-2 pr-3">Cone</th>
                  <th className="py-2 pr-3">Approx °C</th>
                  <th className="py-2 pr-3">Approx °F</th>
                  <th className="py-2">Typical Use Zone</th>
                </tr>
              </thead>
              <tbody>
                {coneTemperatureChart.map((row) => (
                  <tr key={row.cone} className="border-b border-[#F2E6C8]/10">
                    <td className="py-2 pr-3 font-medium">{row.cone}</td>
                    <td className="py-2 pr-3">{row.c}</td>
                    <td className="py-2 pr-3">{row.f}</td>
                    <td className="py-2">{row.zone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-[#F2E6C8]/75">
              Temperatures are equivalent ranges and vary with heating rate, cone type, and manufacturer.
            </p>
          </div>

          <div className="mt-6 overflow-x-auto">
            <h3 className="text-lg font-semibold mb-2">Chart 2: Cone ranges and firing intent</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-[#F2E6C8]/25">
                  <th className="py-2 pr-3">Cone Range</th>
                  <th className="py-2">Typical Firing Intent</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#F2E6C8]/10">
                  <td className="py-2 pr-3 font-medium">022–010</td>
                  <td className="py-2">Luster, decals, very low-temp overglaze work, and low bisque checkpoints</td>
                </tr>
                <tr className="border-b border-[#F2E6C8]/10">
                  <td className="py-2 pr-3 font-medium">06–04</td>
                  <td className="py-2">Low-fire earthenware glaze firings and common school/community kiln ranges</td>
                </tr>
                <tr className="border-b border-[#F2E6C8]/10">
                  <td className="py-2 pr-3 font-medium">03–1</td>
                  <td className="py-2">Transition zone (careful matching needed between clay maturity and glaze melt)</td>
                </tr>
                <tr className="border-b border-[#F2E6C8]/10">
                  <td className="py-2 pr-3 font-medium">5–6</td>
                  <td className="py-2">Mainstream studio mid-fire stoneware production</td>
                </tr>
                <tr className="border-b border-[#F2E6C8]/10">
                  <td className="py-2 pr-3 font-medium">7–8</td>
                  <td className="py-2">High-mid/high where melt fluidity and cooling effects become more pronounced</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">9–12</td>
                  <td className="py-2">High-fire stoneware/porcelain, often with stronger vitrification and atmospheric impact</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 overflow-x-auto">
            <h3 className="text-lg font-semibold mb-2">Chart 3: What cone does to clays and glazes</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-[#F2E6C8]/25">
                  <th className="py-2 pr-3">Range</th>
                  <th className="py-2 pr-3">Clay Effects</th>
                  <th className="py-2">Glaze Effects</th>
                </tr>
              </thead>
              <tbody>
                {coneEffectsChart.map((row) => (
                  <tr key={row.range} className="border-b border-[#F2E6C8]/10">
                    <td className="py-2 pr-3 font-medium align-top">{row.range}</td>
                    <td className="py-2 pr-3 align-top">{row.clay}</td>
                    <td className="py-2 align-top">{row.glaze}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isKnowledgeModalOpen && activeKnowledge ? (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 knowledge-overlay-in"
          onClick={() => setIsKnowledgeModalOpen(false)}
        >
          <article
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-[#F2E6C8]/25 bg-[#4A2F1C] p-5 sm:p-6 shadow-2xl knowledge-modal-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={activeKnowledge.title}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75">
                  {activeKnowledge.level} • {activeKnowledge.category}
                </p>
                <h3 className="text-2xl font-bold mt-1">{activeKnowledge.title}</h3>
              </div>

              <button
                type="button"
                onClick={() => setIsKnowledgeModalOpen(false)}
                className="text-xs px-2.5 py-1 rounded border border-[#F2E6C8]/30 bg-[#F2E6C8]/10 hover:bg-[#F2E6C8]/20"
              >
                Close
              </button>
            </div>

            <p className="mt-3 text-sm text-[#F2E6C8]/90">{activeKnowledge.summary}</p>

            <ul className="mt-4 list-disc pl-5 text-sm space-y-1 text-[#F2E6C8]/95">
              {activeKnowledge.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              {activeKnowledge.keywords.slice(0, 6).map((keyword) => (
                <span
                  key={keyword}
                  className="text-xs px-2 py-1 rounded bg-[#F2E6C8]/15 border border-[#F2E6C8]/20"
                >
                  {keyword}
                </span>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#F2E6C8]/20">
              <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75">Static source basis</p>
              <p className="mt-1 text-xs text-[#F2E6C8]/90">{activeKnowledge.sourceLabels.join(" • ")}</p>
            </div>
          </article>
        </div>
      ) : null}

      {isBrowseModalOpen && activeBrowseSource ? (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 knowledge-overlay-in"
          onClick={() => setIsBrowseModalOpen(false)}
        >
          <article
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-[#F2E6C8]/25 bg-[#4A2F1C] p-5 sm:p-6 shadow-2xl knowledge-modal-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={activeBrowseSource.title}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75">
                  Resource Popout • {activeBrowseSource.category}
                </p>
                <h3 className="text-2xl font-bold mt-1">{formatBrowseLabel(activeBrowseSource.title)}</h3>
                <p className="mt-1 text-xs text-[#F2E6C8]/70">Use ← / → to navigate and Esc to close.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsBrowseModalOpen(false)}
                className="text-xs px-2.5 py-1 rounded border border-[#F2E6C8]/30 bg-[#F2E6C8]/10 hover:bg-[#F2E6C8]/20"
              >
                Close
              </button>
            </div>

            <p className="mt-3 text-sm text-[#F2E6C8]/90">
              This summary is generated from your in-app Ceramics 101 database and related resource mappings.
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (activeBrowseIndex > 0) {
                    setActiveBrowseUrl(browseModalUrls[activeBrowseIndex - 1]);
                  }
                }}
                disabled={activeBrowseIndex <= 0}
                className="text-xs px-2.5 py-1 rounded border border-[#F2E6C8]/30 bg-[#F2E6C8]/10 hover:bg-[#F2E6C8]/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-xs text-[#F2E6C8]/75">
                {activeBrowseIndex >= 0 ? `${activeBrowseIndex + 1} / ${browseModalUrls.length}` : ""}
              </span>

              <button
                type="button"
                onClick={() => {
                  if (activeBrowseIndex >= 0 && activeBrowseIndex < browseModalUrls.length - 1) {
                    setActiveBrowseUrl(browseModalUrls[activeBrowseIndex + 1]);
                  }
                }}
                disabled={activeBrowseIndex < 0 || activeBrowseIndex >= browseModalUrls.length - 1}
                className="text-xs px-2.5 py-1 rounded border border-[#F2E6C8]/30 bg-[#F2E6C8]/10 hover:bg-[#F2E6C8]/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>

            {activeBrowseSections.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75">Topic context</p>
                <ul className="mt-2 list-disc pl-5 text-sm space-y-1 text-[#F2E6C8]/95">
                  {activeBrowseSections.map((sectionItem) => (
                    <li key={sectionItem.title}>
                      <strong>{sectionItem.title}:</strong> {sectionItem.desc}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {activeBrowseKnowledge.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75">Related knowledge entries</p>
                <div className="mt-2 space-y-3">
                  {activeBrowseKnowledge.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-[#F2E6C8]/20 bg-[#F2E6C8]/10 p-3">
                      <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75">{entry.level} • {entry.category}</p>
                      <h4 className="text-base font-semibold mt-1">{entry.title}</h4>
                      <p className="mt-1 text-sm text-[#F2E6C8]/90">{entry.summary}</p>
                      <ul className="mt-2 list-disc pl-5 text-sm space-y-1 text-[#F2E6C8]/95">
                        {entry.details.slice(0, 3).map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeBrowseTopics.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75">Related curriculum topics</p>
                <div className="mt-2 space-y-3">
                  {activeBrowseTopics.slice(0, 3).map((topic) => (
                    <div key={topic.id} className="rounded-lg border border-[#F2E6C8]/20 bg-[#F2E6C8]/10 p-3">
                      <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75">{topic.level}</p>
                      <h4 className="text-base font-semibold mt-1">{topic.title}</h4>
                      <p className="mt-1 text-sm text-[#F2E6C8]/90">{topic.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 pt-3 border-t border-[#F2E6C8]/20">
              <p className="text-xs uppercase tracking-wide text-[#F2E6C8]/75">Resource record</p>
              <p className="mt-1 text-xs text-[#F2E6C8]/90">{activeBrowseSource.title}</p>
            </div>
          </article>
        </div>
      ) : null}
    </main>
  );
}
