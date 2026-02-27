import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dbDir = path.join(rootDir, "app", "ceramics101", "database");
const reviewDir = path.join(dbDir, "discovery-review");
const incomingDir = path.join(dbDir, "incoming");
const configFile = path.join(dbDir, "discovery-feeds.data.json");
const sourcesFile = path.join(dbDir, "sources.data.json");

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
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

function collectByRegex(text, regex) {
  const values = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) values.push(match[1].trim());
  }
  return values;
}

function toHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function makeTitle(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const pathPart = parsed.pathname === "/" ? "home" : parsed.pathname.replace(/\/+$/, "").split("/").filter(Boolean).slice(0, 3).join(" / ");
    return `${host} — ${pathPart || "page"}`;
  } catch {
    return url;
  }
}

function uniqueUrls(urls) {
  const out = [];
  const seen = new Set();
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function pickUrlsFromRss(xmlText) {
  const links = collectByRegex(xmlText, /<link>(https?:\/\/[^<]+)<\/link>/gi);
  return uniqueUrls(links.filter((url) => !url.includes("/feed") && !url.endsWith(".xml")));
}

function pickUrlsFromSitemap(xmlText) {
  const locs = collectByRegex(xmlText, /<loc>(https?:\/\/[^<]+)<\/loc>/gi);
  return uniqueUrls(locs.filter((url) => !url.endsWith(".xml")));
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function runDiscovery() {
  await fs.mkdir(reviewDir, { recursive: true });
  await fs.mkdir(incomingDir, { recursive: true });

  const cfg = asObject(await readJson(configFile, {}));
  const feedDefs = asArray(cfg.feeds);
  const maxCandidatesPerRun = Number(cfg.maxCandidatesPerRun ?? 40);

  const sourcesBundle = asObject(await readJson(sourcesFile, { sources: [] }));
  const knownUrls = new Set(asArray(sourcesBundle.sources).map((s) => s.url));

  const discoveredSources = [];

  for (const feed of feedDefs) {
    const name = feed?.name;
    const url = feed?.url;
    const type = feed?.type;
    const category = feed?.category === "Glazy" ? "Glazy" : "Reference";
    const allowDomains = asArray(feed?.allowDomains).map((d) => String(d).toLowerCase().replace(/^www\./, ""));

    if (!name || !url || !type) continue;

    const xmlText = await fetchText(url);
    if (!xmlText) continue;

    const rawUrls = type === "rss" ? pickUrlsFromRss(xmlText) : pickUrlsFromSitemap(xmlText);

    for (const candidateUrl of rawUrls) {
      const host = toHostname(candidateUrl);
      if (!host) continue;
      if (allowDomains.length > 0 && !allowDomains.some((allowed) => host.endsWith(allowed))) continue;
      if (knownUrls.has(candidateUrl)) continue;
      if (discoveredSources.some((s) => s.url === candidateUrl)) continue;

      discoveredSources.push({
        title: makeTitle(candidateUrl),
        url: candidateUrl,
        category,
        discoveryMeta: {
          feedName: name,
          feedUrl: url,
          discoveredAt: new Date().toISOString(),
        },
      });

      if (discoveredSources.length >= maxCandidatesPerRun) {
        break;
      }
    }

    if (discoveredSources.length >= maxCandidatesPerRun) {
      break;
    }
  }

  if (discoveredSources.length === 0) {
    console.log("[db-discover] No new source candidates found.");
    return;
  }

  const payload = {
    batchMeta: {
      createdAt: new Date().toISOString(),
      totalCandidates: discoveredSources.length,
    },
    sources: discoveredSources,
    topicSources: {},
  };

  const stamp = nowStamp();
  const reviewFile = path.join(reviewDir, `discovery-${stamp}.json`);
  const incomingFile = path.join(incomingDir, `discovery-${stamp}.json`);

  await fs.writeFile(reviewFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await fs.writeFile(incomingFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `[db-discover] Wrote ${discoveredSources.length} source candidates to ${path.basename(reviewFile)} and queued ${path.basename(incomingFile)} for ingest.`,
  );
}

runDiscovery().catch((error) => {
  console.error("[db-discover] Failed", error);
  process.exit(1);
});
