import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dbDir = path.join(rootDir, "app", "market", "database");
const itemsFile = path.join(dbDir, "items.data.json");
const registryFile = path.join(dbDir, "registry.data.json");
const deprecationsFile = path.join(dbDir, "deprecations.data.json");

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

async function auditListing(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    let res;
    try {
      res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    } catch {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }

    if (!res.ok) {
      return { available: false, statusCode: res.status, reason: `http-${res.status}` };
    }

    if (res.headers.get("content-type")?.includes("text/html")) {
      const html = await (await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal })).text();
      const text = html.toLowerCase();
      if (
        text.includes("out of stock") ||
        text.includes("sold out") ||
        text.includes("discontinued") ||
        text.includes("no longer available")
      ) {
        return { available: false, statusCode: res.status, reason: "out-of-stock-text" };
      }
    }

    return { available: true, statusCode: res.status, reason: "ok" };
  } catch {
    return { available: false, statusCode: null, reason: "network-failure" };
  } finally {
    clearTimeout(timer);
  }
}

async function curateMarket() {
  const items = asArray(await readJson(itemsFile, []));
  const registry = asObject(await readJson(registryFile, { version: 1, items: [] }));

  const regMap = new Map();
  for (const row of asArray(registry.items)) {
    if (!row?.sourceUrl) continue;
    regMap.set(row.sourceUrl, row);
  }

  const active = [];
  const deprecated = [];

  for (const item of items) {
    if (!item?.sourceUrl) continue;

    const audit = await auditListing(item.sourceUrl);
    const previous = regMap.get(item.sourceUrl) ?? {
      sourceUrl: item.sourceUrl,
      firstSeenAt: new Date().toISOString(),
      consecutiveFailures: 0,
    };

    const failures = audit.available ? 0 : (previous.consecutiveFailures ?? 0) + 1;
    const stillActive = audit.available && failures < 2;

    const nextRecord = {
      ...previous,
      id: item.id,
      name: item.name,
      category: item.category,
      region: item.region,
      supplier: item.supplier,
      lastVerifiedAt: new Date().toISOString(),
      lastSeenAt: stillActive ? new Date().toISOString().slice(0, 10) : previous.lastSeenAt ?? null,
      consecutiveFailures: failures,
      status: stillActive ? "active" : "deprecated",
      reason: stillActive ? null : audit.reason,
    };

    regMap.set(item.sourceUrl, nextRecord);

    if (stillActive) {
      active.push({
        ...item,
        available: true,
        availabilityStatus: "in-stock",
        lastSeenAt: new Date().toISOString().slice(0, 10),
        lastVerifiedAt: new Date().toISOString(),
      });
    } else {
      deprecated.push({
        id: item.id,
        name: item.name,
        category: item.category,
        sourceUrl: item.sourceUrl,
        reason: audit.reason,
        lastVerifiedAt: new Date().toISOString(),
      });
    }
  }

  await writeJson(itemsFile, active.sort((a, b) => a.name.localeCompare(b.name)));
  await writeJson(registryFile, {
    version: 1,
    updatedAt: new Date().toISOString(),
    items: Array.from(regMap.values()).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
  });
  await writeJson(deprecationsFile, {
    updatedAt: new Date().toISOString(),
    items: deprecated,
  });

  console.log(`[market-curate] active=${active.length} deprecatedThisRun=${deprecated.length}`);
}

curateMarket().catch((error) => {
  console.error("[market-curate] Failed", error);
  process.exit(1);
});
