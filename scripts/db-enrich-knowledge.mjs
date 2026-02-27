import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dbDir = path.join(rootDir, "app", "ceramics101", "database");
const sourcesFile = path.join(dbDir, "sources.data.json");
const knowledgeFile = path.join(dbDir, "knowledge.data.json");
const curriculumFile = path.join(dbDir, "curriculum.data.json");

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function toHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function pathSlug(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/\/$/, "").split("/").filter(Boolean).slice(-2).join("-") || "home";
  } catch {
    return "source";
  }
}

function toId(url) {
  return `k-auto-src-${toHostname(url)}-${pathSlug(url)}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

function titleFromUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const slug = parsed.pathname.replace(/\/$/, "").split("/").filter(Boolean).slice(-1)[0] || "home";
    const pretty = slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
    return `${pretty} (${host})`;
  } catch {
    return "Ceramics Source";
  }
}

function inferLevel(topicIds) {
  if (topicIds.some((id) => id.startsWith("m-"))) return "Master";
  if (topicIds.some((id) => id.startsWith("a-"))) return "Advanced";
  if (topicIds.some((id) => id.startsWith("i-"))) return "Intermediate";
  return "Beginner";
}

function inferCategory(url, sourceCategory) {
  const u = url.toLowerCase();
  if (u.includes("defect") || u.includes("troubleshoot")) return "Troubleshooting";
  if (u.includes("temperature") || u.includes("cone") || u.includes("firing") || u.includes("kiln")) return "Firing & Heatwork";
  if (u.includes("glaze") || u.includes("mixing") || u.includes("recipe")) return "Glaze Systems";
  if (u.includes("clay") || u.includes("earthenware") || u.includes("stoneware") || u.includes("porcelain")) return "Clay Body Science";
  if (sourceCategory === "Glazy") return "Glaze Practice";
  return "Ceramics Reference";
}

function inferKeywords(url, title, sourceCategory) {
  const base = ["ceramics", "pottery", "studio practice", "learning reference"];
  const extras = [];
  const u = url.toLowerCase();
  const t = (title || "").toLowerCase();

  if (u.includes("firing") || u.includes("kiln") || u.includes("temperature")) extras.push("firing", "kiln", "heatwork");
  if (u.includes("glaze") || t.includes("glaze")) extras.push("glaze", "surface", "recipe testing");
  if (u.includes("clay") || t.includes("clay")) extras.push("clay", "body", "material behavior");
  if (u.includes("defect")) extras.push("defects", "diagnosis", "quality control");
  if (sourceCategory === "Glazy") extras.push("glazy", "community knowledge");

  return Array.from(new Set([...base, ...extras]));
}

function robustDetails({ url, title, sourceCategory, topicIds }) {
  const host = toHostname(url);
  const topicText = topicIds.length > 0 ? topicIds.join(", ") : "general ceramics topics";

  return [
    `What this source is best for: ${title || host} provides focused reference material for ${topicText}.`,
    "How to use it in practice: read the concept page first, then extract one testable studio change for your next firing cycle.",
    "Validation workflow: cross-check recommendations against your clay body, cone range, glaze chemistry, and kiln atmosphere.",
    "Documentation standard: capture changes in your studio log (recipe version, application thickness, firing schedule, outcome photos).",
    "Reliability note: treat online guidance as a starting point and confirm through controlled tile tests before production use.",
    `Source type: ${sourceCategory === "Glazy" ? "community + help center" : "reference / institutional"}; always verify with your local process constraints.`,
  ];
}

async function run() {
  const sourcesBundle = asObject(await readJson(sourcesFile, { sources: [], topicSources: {} }));
  const knowledge = asArray(await readJson(knowledgeFile, []));
  const curriculum = asArray(await readJson(curriculumFile, []));

  const sources = asArray(sourcesBundle.sources);
  const topicSources = asObject(sourcesBundle.topicSources);

  const sourceByUrl = new Map();
  for (const source of sources) {
    if (source?.url) sourceByUrl.set(source.url, source);
  }

  for (const [topicId, urls] of Object.entries(topicSources)) {
    for (const url of asArray(urls)) {
      if (!url || typeof url !== "string") continue;
      if (sourceByUrl.has(url)) continue;
      sourceByUrl.set(url, {
        title: titleFromUrl(url),
        url,
        category: "Reference",
      });
    }
  }

  const topicIdsByUrl = new Map();
  for (const [topicId, urls] of Object.entries(topicSources)) {
    for (const url of asArray(urls)) {
      if (!url || typeof url !== "string") continue;
      const list = topicIdsByUrl.get(url) ?? [];
      topicIdsByUrl.set(url, Array.from(new Set([...list, topicId])));
    }
  }

  const curriculumById = new Map(curriculum.map((topic) => [topic.id, topic]));

  const manualKnowledge = knowledge.filter((entry) => !String(entry.id || "").startsWith("k-auto-src-"));
  const autoKnowledge = [];

  for (const [url, source] of sourceByUrl.entries()) {
    const topicIds = topicIdsByUrl.get(url) ?? [];
    const level = inferLevel(topicIds);
    const sourceTitle = source?.title || titleFromUrl(url);
    const sourceCategory = source?.category === "Glazy" ? "Glazy" : "Reference";

    const linkedTopicTitles = topicIds
      .map((topicId) => curriculumById.get(topicId)?.title)
      .filter(Boolean)
      .slice(0, 4);

    const details = robustDetails({
      url,
      title: sourceTitle,
      sourceCategory,
      topicIds,
    });

    if (linkedTopicTitles.length > 0) {
      details.splice(1, 0, `Directly linked learning topics: ${linkedTopicTitles.join("; ")}.`);
    }

    autoKnowledge.push({
      id: toId(url),
      level,
      title: `${sourceTitle} — Study Guide`,
      category: inferCategory(url, sourceCategory),
      summary:
        "A curated study guide entry generated from an available learning link, designed to translate reference material into actionable ceramics practice.",
      details,
      keywords: inferKeywords(url, sourceTitle, sourceCategory),
      sourceLabels: [sourceTitle],
    });
  }

  const nextKnowledge = [...manualKnowledge, ...autoKnowledge].sort((a, b) => a.title.localeCompare(b.title));
  const nextSources = Array.from(sourceByUrl.values()).sort((a, b) => String(a.title).localeCompare(String(b.title)));

  await writeJson(sourcesFile, {
    sources: nextSources,
    topicSources,
  });

  await writeJson(knowledgeFile, nextKnowledge);

  console.log(
    `[db-enrich] Linked sources=${nextSources.length}, autoKnowledge=${autoKnowledge.length}, totalKnowledge=${nextKnowledge.length}`,
  );
}

run().catch((error) => {
  console.error("[db-enrich] Failed", error);
  process.exit(1);
});
