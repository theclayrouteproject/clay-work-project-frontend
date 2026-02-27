import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dbDir = path.join(rootDir, "app", "ceramics101", "database");
const sourcesFile = path.join(dbDir, "sources.data.json");
const sourceRegistryFile = path.join(dbDir, "source-registry.data.json");
const materialsFile = path.join(dbDir, "materials.data.json");
const deprecationsFile = path.join(dbDir, "deprecations.data.json");

const RUN_AUDIT = process.argv.includes("--audit");

function isoNow() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysSince(isoDate) {
  if (!isoDate) return 9999;
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.floor(ms / 86_400_000);
}

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

function baseQuality(category) {
  if (category === "Glazy") return 0.8;
  return 0.7;
}

async function auditUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  try {
    let res;
    try {
      res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    } catch {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }

    return {
      reachable: res.ok,
      statusCode: res.status,
    };
  } catch {
    return {
      reachable: false,
      statusCode: null,
    };
  } finally {
    clearTimeout(timer);
  }
}

function upsertSourceRecord(recordMap, source) {
  const existing = recordMap.get(source.url);
  if (existing) {
    recordMap.set(source.url, {
      ...existing,
      title: source.title,
      category: source.category,
      status: existing.status ?? "active",
      qualityScore: existing.qualityScore ?? baseQuality(source.category),
      stalenessScore: existing.stalenessScore ?? 0,
      lastSeenAt: today(),
    });
    return;
  }

  recordMap.set(source.url, {
    url: source.url,
    title: source.title,
    category: source.category,
    status: "active",
    qualityScore: baseQuality(source.category),
    stalenessScore: 0,
    firstSeenAt: today(),
    lastSeenAt: today(),
    lastVerifiedAt: null,
    consecutiveFailures: 0,
    notes: [],
  });
}

async function curateSourcesAndMaterials() {
  const sourceBundle = await readJson(sourcesFile, { sources: [], topicSources: {} });
  const registry = await readJson(sourceRegistryFile, { version: 1, sources: [] });
  const materials = await readJson(materialsFile, []);

  const sourceMap = new Map();
  for (const item of asArray(registry.sources)) {
    if (item?.url) sourceMap.set(item.url, item);
  }

  for (const source of asArray(sourceBundle.sources)) {
    if (source?.url && source?.title) {
      upsertSourceRecord(sourceMap, source);
    }
  }

  const currentUrls = new Set(asArray(sourceBundle.sources).map((s) => s.url));
  for (const [url, record] of sourceMap.entries()) {
    if (!currentUrls.has(url)) {
      sourceMap.set(url, {
        ...record,
        status: "deprecated",
        notes: Array.from(new Set([...(record.notes ?? []), "No longer in active source list"])),
      });
    }
  }

  if (RUN_AUDIT) {
    for (const [url, record] of sourceMap.entries()) {
      const { reachable, statusCode } = await auditUrl(url);
      if (reachable) {
        sourceMap.set(url, {
          ...record,
          status: record.status === "deprecated" ? "deprecated" : "active",
          qualityScore: Math.min(1, Number((record.qualityScore + 0.01).toFixed(2))),
          stalenessScore: Math.max(0, record.stalenessScore - 0.05),
          lastVerifiedAt: isoNow(),
          consecutiveFailures: 0,
        });
      } else {
        const failures = (record.consecutiveFailures ?? 0) + 1;
        sourceMap.set(url, {
          ...record,
          status: failures >= 3 ? "needs-review" : record.status,
          stalenessScore: Math.min(1, Number((record.stalenessScore + 0.2).toFixed(2))),
          lastVerifiedAt: isoNow(),
          consecutiveFailures: failures,
          notes: Array.from(new Set([...(record.notes ?? []), `Audit failed status=${statusCode ?? "timeout"}`])),
        });
      }
    }
  }

  const updatedMaterials = asArray(materials).map((material) => {
    const lastSeenDays = daysSince(material.lastSeenAt);
    let availabilityStatus = material.availabilityStatus ?? "uncertain";

    if (availabilityStatus === "available" && lastSeenDays > 365) {
      availabilityStatus = "uncertain";
    }
    if ((availabilityStatus === "uncertain" || availabilityStatus === "available") && lastSeenDays > 730) {
      availabilityStatus = "deprecated";
    }

    return {
      ...material,
      availabilityStatus,
      stalenessDays: lastSeenDays,
    };
  });

  const deprecatedMaterials = updatedMaterials
    .filter((m) => m.availabilityStatus === "deprecated")
    .map((m) => ({
      name: m.name,
      reason: `No verified availability signal for ${m.stalenessDays} days`,
      lastSeenAt: m.lastSeenAt ?? null,
    }));

  const deprecatedSources = Array.from(sourceMap.values())
    .filter((s) => s.status === "needs-review" || s.status === "deprecated")
    .map((s) => ({
      url: s.url,
      title: s.title,
      status: s.status,
      reason: s.status === "deprecated" ? "Removed from active list" : "Repeated source audit failures",
      lastVerifiedAt: s.lastVerifiedAt ?? null,
    }));

  await writeJson(sourceRegistryFile, {
    version: 1,
    updatedAt: isoNow(),
    sources: Array.from(sourceMap.values()).sort((a, b) => a.title.localeCompare(b.title)),
  });

  await writeJson(materialsFile, updatedMaterials);

  await writeJson(deprecationsFile, {
    updatedAt: isoNow(),
    materials: deprecatedMaterials,
    sources: deprecatedSources,
  });

  console.log(
    `[db-curate] Updated registry (${sourceMap.size} sources), materials (${updatedMaterials.length}), deprecations (materials=${deprecatedMaterials.length}, sources=${deprecatedSources.length})`,
  );
}

curateSourcesAndMaterials().catch((error) => {
  console.error("[db-curate] Failed", error);
  process.exit(1);
});
