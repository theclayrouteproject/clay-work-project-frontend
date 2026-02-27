import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dbDir = path.join(rootDir, "app", "market", "database");
const configFile = path.join(dbDir, "discovery-feeds.data.json");
const itemsFile = path.join(dbDir, "items.data.json");
const reviewDir = path.join(dbDir, "discovery-review");
const incomingDir = path.join(dbDir, "incoming");
const LOGO_FALLBACK = "/TCRP%20Logo_2.png";

const hostImageCache = new Map();
const CONTINENTAL_EXCLUDED = new Set(["AK", "HI", "PR", "GU", "VI", "MP", "AS"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
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

function pickCandidates(xmlText, type) {
  if (type === "rss") {
    const candidates = [];
    const itemBlocks = Array.from(xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi)).map((match) => match[1]);
    for (const block of itemBlocks) {
      const link = block.match(/<link>(https?:\/\/[^<]+)<\/link>/i)?.[1]?.trim();
      if (!link || link.endsWith(".xml") || link.includes("/feed")) continue;
      const title = block.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
      const description = block.match(/<description>([\s\S]*?)<\/description>/i)?.[1]?.trim() || "";
      candidates.push({
        url: link,
        title: title.replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
        description: description.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      });
    }
    return candidates;
  }

  const vals =
    type === "sitemap"
      ? collectByRegex(xmlText, /<loc>(https?:\/\/[^<]+)<\/loc>/gi)
      : collectByRegex(xmlText, /<link>(https?:\/\/[^<]+)<\/link>/gi);

  return Array.from(new Set(vals.filter((url) => !url.endsWith(".xml") && !url.includes("/feed")))).map((url) => ({
    url,
    title: "",
    description: "",
  }));
}

function toHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function inferCategory(url, hintText = "") {
  const s = `${url} ${hintText}`.toLowerCase();
  if (s.includes("kiln")) return "Kilns";
  if (s.includes("wheel") || s.includes("machine")) return "Machines";
  if (s.includes("clay") || s.includes("porcelain") || s.includes("stoneware")) return "Clays";
  if (s.includes("feldspar") || s.includes("silica") || s.includes("kaolin") || s.includes("ingredient")) return "Ingredients";
  return "Tools";
}

function inferCondition(url, hintText = "") {
  const s = `${url} ${hintText}`.toLowerCase();
  if (s.includes("refurb") || s.includes("reconditioned")) return "Refurbished";
  if (s.includes("used") || s.includes("pre-owned") || s.includes("preowned") || s.includes("second hand")) return "Used";
  return "New";
}

function isContinentalState(state) {
  if (!state) return true;
  return !CONTINENTAL_EXCLUDED.has(String(state).toUpperCase());
}

function isRealEstateListing(url, title = "", description = "") {
  const text = `${url} ${title} ${description}`.toLowerCase();
  const blockedPatterns = [
    /\breal\s*estate\b/,
    /\brealtor\b/,
    /\bmls\b/,
    /\bproperty\b/,
    /\bapartment\b/,
    /\bcondo\b/,
    /\bhouse\b/,
    /\bhome\s+for\s+sale\b/,
    /\bland\s+for\s+sale\b/,
    /\blot\s+for\s+sale\b/,
    /\bforeclosure\b/,
    /\bfor\s+rent\b/,
    /\blease\b/,
    /\bbedroom\b/,
    /\bbathroom\b/,
    /\bsq\.?\s*ft\b/,
    /\bsquare\s+feet\b/,
    /\bacre(?:s)?\b/,
  ];

  return blockedPatterns.some((pattern) => pattern.test(text));
}

function titleFromUrl(url) {
  try {
    const parsed = new URL(url);
    const seg = parsed.pathname.split("/").filter(Boolean).pop() ?? "item";
    return seg
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Market Item";
  }
}

function toId(name, url) {
  return `${name}-${url}`
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function imageFromSourceUrl(sourceUrl) {
  return /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(sourceUrl) ? sourceUrl : LOGO_FALLBACK;
}

async function resolveProductImage(sourceUrl, host) {
  const directImage = imageFromSourceUrl(sourceUrl);
  if (directImage !== LOGO_FALLBACK) {
    return directImage;
  }

  if (hostImageCache.has(host)) {
    return hostImageCache.get(host) ?? LOGO_FALLBACK;
  }

  const discovered = await discoverImageForProductPage(sourceUrl);
  const resolved = discovered ?? LOGO_FALLBACK;
  hostImageCache.set(host, resolved);
  return resolved;
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

function extractMetaImage(html, pageUrl) {
  const metaTagRegex = /<meta\s+[^>]*>/gi;
  const propRegex = /(?:property|name)\s*=\s*["']([^"']+)["']/i;
  const contentRegex = /content\s*=\s*["']([^"']+)["']/i;

  let match;
  while ((match = metaTagRegex.exec(html)) !== null) {
    const tag = match[0];
    const propMatch = tag.match(propRegex);
    const contentMatch = tag.match(contentRegex);
    if (!propMatch || !contentMatch) continue;

    const prop = String(propMatch[1] ?? "").toLowerCase().trim();
    const content = String(contentMatch[1] ?? "").trim();
    if (!content) continue;
    if (prop !== "og:image" && prop !== "twitter:image") continue;

    try {
      return new URL(content, pageUrl).toString();
    } catch {
      continue;
    }
  }

  return null;
}

async function discoverImageForProductPage(sourceUrl) {
  const html = await fetchText(sourceUrl);
  if (!html) return null;
  return extractMetaImage(html, sourceUrl);
}

async function discoverMarketItems() {
  await fs.mkdir(reviewDir, { recursive: true });
  await fs.mkdir(incomingDir, { recursive: true });

  const cfg = asObject(await readJson(configFile, {}));
  const feeds = asArray(cfg.feeds);
  const maxCandidatesPerRun = Number(cfg.maxCandidatesPerRun ?? 40);
  const liveItems = asArray(await readJson(itemsFile, []));
  const knownUrls = new Set(liveItems.map((item) => item.sourceUrl));

  const discovered = [];

  for (const feed of feeds) {
    const feedName = feed?.name;
    const feedUrl = feed?.url;
    const type = feed?.type;
    const allowDomains = asArray(feed?.allowDomains).map((d) => String(d).toLowerCase().replace(/^www\./, ""));
    const includePathContains = asArray(feed?.includePathContains).map((v) => String(v).toLowerCase()).filter(Boolean);
    const defaultRegion = String(feed?.defaultRegion ?? "US");
    const defaultState = String(feed?.defaultState ?? "").toUpperCase();
    const maxPerFeed = Number(feed?.maxPerFeed ?? Math.max(20, Math.floor(maxCandidatesPerRun / Math.max(feeds.length, 1))));
    let addedForFeed = 0;

    if (!feedName || !feedUrl || !type) continue;

    const text = await fetchText(feedUrl);
    if (!text) continue;

    const candidates = pickCandidates(text, type);

    for (const candidate of candidates) {
      const sourceUrl = candidate.url;
      const host = toHostname(sourceUrl);
      if (!host) continue;
      if (allowDomains.length > 0 && !allowDomains.some((allowed) => host.endsWith(allowed))) continue;
      if (includePathContains.length > 0) {
        const normalized = `${sourceUrl} ${candidate.title} ${candidate.description}`.toLowerCase();
        const matchesIncludedPath = includePathContains.some((segment) => normalized.includes(segment));
        if (!matchesIncludedPath) continue;
      }
      if (isRealEstateListing(sourceUrl, candidate.title, candidate.description)) continue;
      if (knownUrls.has(sourceUrl)) continue;
      if (discovered.some((item) => item.sourceUrl === sourceUrl)) continue;

      const name = candidate.title || titleFromUrl(sourceUrl);
      const imageUrl = await resolveProductImage(sourceUrl, host);
      const category = inferCategory(sourceUrl, `${feedName} ${candidate.title} ${candidate.description}`);
      const condition = inferCondition(sourceUrl, `${feedName} ${candidate.title} ${candidate.description}`);
      if (!isContinentalState(defaultState)) continue;
      discovered.push({
        id: toId(name, sourceUrl),
        name,
        category,
        subcategory: "Unspecified",
        description:
          candidate.description ||
          "Auto-discovered market listing. Verify supplier specifications, fit, and availability before studio purchase.",
        region: defaultRegion,
        state: defaultState || "US",
        supplier: host,
        condition,
        currency: "USD",
        price: null,
        unit: "unit",
        minOrderQty: "1 unit",
        available: true,
        availabilityStatus: "in-stock",
        stockStatus: "Stock status to confirm with supplier",
        leadTime: "Lead time to confirm",
        applications: ["Studio production", "Testing and trials"],
        compatibleWith: ["Stoneware workflows", "Porcelain workflows"],
        certifications: ["Supplier documentation required"],
        safetyNotes: ["Review SDS and handling instructions before use"],
        packageOptions: ["Standard supplier packaging"],
        procurementNotes: "Confirm regional pricing, minimum order quantity, and payment terms with supplier.",
        shippingNotes: "Shipping costs and import fees vary by region and carrier.",
        supportNotes: "Use supplier technical support for fit and performance validation.",
        specifications: [
          { label: "Product Type", value: "Supplier listing" },
          { label: "Verification", value: "Pending studio validation" },
        ],
        sourceUrl,
        imageUrl,
        lastSeenAt: new Date().toISOString().slice(0, 10),
        lastVerifiedAt: null,
        createdAt: new Date().toISOString(),
        discoveryMeta: {
          feedName,
          feedUrl,
          discoveredAt: new Date().toISOString(),
        },
      });

      addedForFeed += 1;

      if (discovered.length >= maxCandidatesPerRun) break;
      if (addedForFeed >= maxPerFeed) break;
    }

    if (discovered.length >= maxCandidatesPerRun) break;
  }

  if (discovered.length === 0) {
    console.log("[market-discover] No new market candidates found.");
    return;
  }

  const payload = {
    batchMeta: {
      createdAt: new Date().toISOString(),
      totalCandidates: discovered.length,
    },
    items: discovered,
  };

  const stamp = nowStamp();
  const reviewFile = path.join(reviewDir, `market-discovery-${stamp}.json`);
  const incomingFile = path.join(incomingDir, `market-discovery-${stamp}.json`);

  await fs.writeFile(reviewFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await fs.writeFile(incomingFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `[market-discover] Wrote ${discovered.length} candidate items to ${path.basename(reviewFile)} and queued ${path.basename(incomingFile)} for ingest.`,
  );
}

discoverMarketItems().catch((error) => {
  console.error("[market-discover] Failed", error);
  process.exit(1);
});
