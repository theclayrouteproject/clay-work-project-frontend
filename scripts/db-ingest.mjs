import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dbDir = path.join(rootDir, "app", "ceramics101", "database");
const incomingDir = path.join(dbDir, "incoming");
const processedDir = path.join(incomingDir, "processed");

const curriculumFile = path.join(dbDir, "curriculum.data.json");
const knowledgeFile = path.join(dbDir, "knowledge.data.json");
const sourcesFile = path.join(dbDir, "sources.data.json");

const WATCH_FLAG = process.argv.includes("--watch");

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function uniqueStrings(values) {
  return Array.from(new Set((values ?? []).filter((v) => typeof v === "string" && v.trim().length > 0)));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizePayload(payload) {
  const data = asObject(payload);

  let curriculum = asArray(data.curriculum);
  let knowledge = asArray(data.knowledge);
  let sources = asArray(data.sources);
  let topicSources = asObject(data.topicSources);

  if (curriculum.length === 0 && data.id && data.level && data.steps) {
    curriculum = [data];
  }

  if (knowledge.length === 0 && data.id && data.level && data.details) {
    knowledge = [data];
  }

  if (sources.length === 0 && data.url && data.title && data.category) {
    sources = [data];
  }

  return { curriculum, knowledge, sources, topicSources };
}

function mergeByKey(existing, incoming, key) {
  const map = new Map();

  for (const entry of existing) {
    if (entry && entry[key] != null) {
      map.set(entry[key], entry);
    }
  }

  for (const entry of incoming) {
    if (entry && entry[key] != null) {
      map.set(entry[key], entry);
    }
  }

  return Array.from(map.values());
}

function mergeTopicSources(existing, incoming) {
  const merged = { ...existing };

  for (const [topicId, urls] of Object.entries(asObject(incoming))) {
    merged[topicId] = uniqueStrings([...(merged[topicId] ?? []), ...asArray(urls)]);
  }

  return merged;
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

async function ensureDirs() {
  await fs.mkdir(incomingDir, { recursive: true });
  await fs.mkdir(processedDir, { recursive: true });
}

async function listIncomingFiles() {
  const entries = await fs.readdir(incomingDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(incomingDir, entry.name));
}

async function processFile(filePath) {
  const fileName = path.basename(filePath);

  let payload;
  try {
    payload = JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    console.error(`[db-ingest] Skipped ${fileName}: invalid JSON`);
    return;
  }

  const incoming = normalizePayload(payload);

  if (
    incoming.curriculum.length === 0 &&
    incoming.knowledge.length === 0 &&
    incoming.sources.length === 0 &&
    Object.keys(incoming.topicSources).length === 0
  ) {
    console.warn(`[db-ingest] Skipped ${fileName}: no recognized fields`);
    return;
  }

  const curriculum = await readJson(curriculumFile, []);
  const knowledge = await readJson(knowledgeFile, []);
  const sourceBundle = await readJson(sourcesFile, { sources: [], topicSources: {} });

  const nextCurriculum = mergeByKey(asArray(curriculum), incoming.curriculum, "id");
  const nextKnowledge = mergeByKey(asArray(knowledge), incoming.knowledge, "id");
  const nextSources = mergeByKey(asArray(sourceBundle.sources), incoming.sources, "url");
  const nextTopicSources = mergeTopicSources(asObject(sourceBundle.topicSources), incoming.topicSources);

  await writeJson(curriculumFile, nextCurriculum);
  await writeJson(knowledgeFile, nextKnowledge);
  await writeJson(sourcesFile, {
    sources: nextSources,
    topicSources: nextTopicSources,
  });

  const stampedName = `${fileName.replace(/\.json$/i, "")}.${nowStamp()}.processed.json`;
  await fs.rename(filePath, path.join(processedDir, stampedName));

  console.log(
    `[db-ingest] Processed ${fileName}: +${incoming.curriculum.length} curriculum, +${incoming.knowledge.length} knowledge, +${incoming.sources.length} sources, +${Object.keys(incoming.topicSources).length} topicSource maps`,
  );
}

let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;

  try {
    const files = await listIncomingFiles();
    for (const filePath of files) {
      await processFile(filePath);
    }
  } finally {
    processing = false;
  }
}

async function runOnce() {
  await ensureDirs();
  await processQueue();
}

async function runWatch() {
  await ensureDirs();
  await processQueue();

  console.log(`[db-ingest] Watching ${incomingDir}`);

  fs.watch(incomingDir, async (eventType, fileName) => {
    if (!fileName || !fileName.endsWith(".json")) return;
    if (eventType !== "rename" && eventType !== "change") return;
    await processQueue();
  });
}

if (WATCH_FLAG) {
  runWatch().catch((error) => {
    console.error("[db-ingest] Worker failed", error);
    process.exit(1);
  });
} else {
  runOnce().catch((error) => {
    console.error("[db-ingest] Ingest failed", error);
    process.exit(1);
  });
}
