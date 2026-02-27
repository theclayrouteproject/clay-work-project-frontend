import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dbDir = path.join(rootDir, "app", "glazes", "database");
const configFile = path.join(dbDir, "discovery-feeds.data.json");
const glazesFile = path.join(dbDir, "glazes.data.json");
const incomingDir = path.join(dbDir, "incoming");

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

function stripTags(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(candidate, baseUrl) {
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate, baseUrl);
    if (!parsed.protocol.startsWith("http")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function pickUrls(sourceText, type, baseUrl) {
  const vals =
    type === "sitemap"
      ? collectByRegex(sourceText, /<loc>(https?:\/\/[^<]+)<\/loc>/gi)
      : type === "html"
        ? collectByRegex(sourceText, /href=["']([^"']+)["']/gi)
        : collectByRegex(sourceText, /<link>(https?:\/\/[^<]+)<\/link>/gi);

  return Array.from(
    new Set(
      vals
        .map((url) => normalizeUrl(url, baseUrl))
        .filter(
          (url) =>
            url &&
            !url.endsWith(".xml") &&
            !url.includes("/feed") &&
            !url.includes("/tag/") &&
            !url.includes("/category/") &&
            !url.includes("wp-json") &&
            !url.includes("#"),
        ),
    ),
  );
}

function toHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function toTitle(url) {
  try {
    const p = new URL(url);
    const slug = p.pathname.split("/").filter(Boolean).pop() ?? "glaze";
    return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "New Glaze";
  }
}

function titleCase(value) {
  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toId(value) {
  return value
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanupMaker(value) {
  return String(value ?? "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitleFromHtml(htmlText, fallback) {
  const ogTitle = htmlText.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ogTitle) return titleCase(decodeHtmlEntities(ogTitle));

  const htmlTitle = htmlText.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (htmlTitle) {
    const normalized = decodeHtmlEntities(htmlTitle)
      .replace(/\s*[|•-]\s*[^|•-]+$/, "")
      .trim();
    if (normalized.length > 3) return titleCase(normalized);
  }

  return fallback;
}

function extractDescriptionFromHtml(htmlText) {
  const metaDescription = htmlText.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (metaDescription) {
    return decodeHtmlEntities(metaDescription).trim();
  }

  const paragraph = htmlText.match(/<p[^>]*>([\s\S]{80,320}?)<\/p>/i)?.[1];
  if (!paragraph) return "";
  return stripTags(paragraph).slice(0, 220);
}

function extractConeFromText(text) {
  const cone = text.match(/\bcone\s*([0-9]{1,2}(?:\s*[-–]\s*[0-9]{1,2})?)\b/i);
  if (!cone?.[1]) return "Cone 6";
  return `Cone ${cone[1].replace(/\s+/g, "")}`;
}

function normalizeIngredientName(value) {
  return String(value)
    .replace(/\(.*?\)/g, "")
    .replace(/^[\s:;,.\-–—]+/, "")
    .replace(/\b(batch|recipe|ingredients?)\b\s*:?/gi, "")
    .replace(/\b[0-9]+(?:\.[0-9]+)?\s*(%|g|kg|lb|lbs|oz|ounces?)\b/gi, "")
    .replace(/[^a-zA-Z0-9\s'\-/,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function likelyIngredientName(name) {
  const normalized = name.toLowerCase();
  if (normalized.length < 2 || normalized.length > 80) return false;
  const blocked = [
    "cone",
    "recipe",
    "variation",
    "version",
    "firing",
    "temperature",
    "comment",
    "posted",
    "copyright",
    "newsletter",
    "share",
    "read more",
    "author",
    "menu",
    "tools",
    "testing",
    "test",
    "tile",
    "bisque",
    "self hardening",
    "air dry",
    "modeling",
    "we used",
  ];
  return !blocked.some((token) => normalized.includes(token));
}

const ceramicIngredientKeywords = [
  "feldspar",
  "silica",
  "kaolin",
  "whiting",
  "dolomite",
  "nepheline",
  "syenite",
  "ball clay",
  "bentonite",
  "wollastonite",
  "talc",
  "rutile",
  "zinc",
  "borate",
  "boron",
  "frit",
  "oxide",
  "carbonate",
  "stain",
  "ash",
  "spodumene",
  "grolleg",
  "petalite",
  "albany",
  "custer",
  "kona",
  "gillespie",
  "iron",
  "copper",
  "cobalt",
  "manganese",
  "tin",
  "nickel",
  "lithium",
  "gerstley",
  "strontium",
  "barium",
  "magnesium",
  "alumina",
  "zircon",
  "zircopax",
  "epk",
  "china clay",
  "fire clay",
  "redart",
  "red art",
  "rio",
  "bone ash",
  "cornwall",
  "flint",
  "borax",
  "cryolite",
  "ilmenite",
];

function looksLikeCeramicIngredient(value) {
  const normalized = String(value).toLowerCase();
  if (!likelyIngredientName(normalized)) return false;
  return ceramicIngredientKeywords.some((keyword) => normalized.includes(keyword));
}

function collectIngredientName(recipeMap, ingredient) {
  const cleaned = normalizeIngredientName(ingredient);
  if (!cleaned) return;
  if (/[0-9]+\s+testing/i.test(cleaned)) return;
  if (/\bmenu\b|\btools\b|\btest(?:ing)?\b|\bbisque\b|\btile\b/i.test(cleaned)) return;
  if (!likelyIngredientName(cleaned)) return;
  if (!looksLikeCeramicIngredient(cleaned)) return;
  const key = cleaned.toLowerCase();
  if (!recipeMap.has(key)) {
    recipeMap.set(key, { name: cleaned, amount: 0, unit: "%" });
  }
}

function extractMeasuredRecipeFromHtml(htmlText) {
  const recipeMap = new Map();

  const tableRows = Array.from(htmlText.matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/gi)).map((match) => match[0]);
  for (const row of tableRows) {
    const cells = Array.from(row.matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)).map((m) => stripTags(m[1]));
    if (cells.length < 2) continue;

    const ingredient = normalizeIngredientName(cells[0]);
    const amountMatch = cells[1].match(/([0-9]{1,3}(?:\.[0-9]{1,2})?)\s*(%|g)\b/i);
    if (!amountMatch) continue;
    if (!likelyIngredientName(ingredient)) continue;

    const amount = Number(amountMatch[1]);
    const unit = amountMatch[2] === "%" ? "%" : "g";
    if (!Number.isFinite(amount) || amount <= 0) continue;

    if (!recipeMap.has(ingredient.toLowerCase())) {
      recipeMap.set(ingredient.toLowerCase(), { name: ingredient, amount, unit });
    }
  }

  const text = stripTags(htmlText);
  const inlineMatches = Array.from(
    text.matchAll(/([A-Za-z][A-Za-z0-9\s'\-/,]{2,70}?)\s*[:\-]?\s*([0-9]{1,3}(?:\.[0-9]{1,2})?)\s*(%|g)\b/g),
  );
  for (const match of inlineMatches) {
    const ingredient = normalizeIngredientName(match[1]);
    if (!likelyIngredientName(ingredient)) continue;
    const amount = Number(match[2]);
    const unit = match[3] === "%" ? "%" : "g";
    if (!Number.isFinite(amount) || amount <= 0) continue;

    if (!recipeMap.has(ingredient.toLowerCase())) {
      recipeMap.set(ingredient.toLowerCase(), { name: ingredient, amount, unit });
    }
  }

  const recipe = Array.from(recipeMap.values()).slice(0, 40);
  return recipe;
}

function extractIngredientListFromHtml(htmlText) {
  const ingredientMap = new Map();

  const listItems = Array.from(htmlText.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((match) => stripTags(match[1]));
  for (const line of listItems) {
    collectIngredientName(ingredientMap, line);
  }

  const tableRows = Array.from(htmlText.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  for (const row of tableRows) {
    const firstCell = row.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/i)?.[1];
    if (!firstCell) continue;
    collectIngredientName(ingredientMap, stripTags(firstCell));
  }

  const headingBlocks = Array.from(
    htmlText.matchAll(
      /<(?:h2|h3|h4)[^>]*>[^<]*(?:ingredients?|recipe)[^<]*<\/(?:h2|h3|h4)>\s*([\s\S]{0,1800}?)(?=<(?:h2|h3|h4)[^>]*>|<\/article>|<\/section>|$)/gi,
    ),
  ).map((match) => stripTags(match[1]));

  for (const block of headingBlocks) {
    const lines = block
      .split(/[\n\r•·|]+/)
      .map((line) => line.trim())
      .filter(Boolean);
    for (const line of lines) {
      collectIngredientName(ingredientMap, line);
    }
  }

  return Array.from(ingredientMap.values()).slice(0, 60);
}

function extractMakerFromHtml(htmlText) {
  const authorMeta = htmlText.match(/<meta[^>]+(?:name|property)=["'](?:author|article:author)["'][^>]+content=["']([^"']+)["']/i);
  if (authorMeta?.[1]) return cleanupMaker(decodeHtmlEntities(authorMeta[1]));

  const jsonLdAuthor = htmlText.match(/"author"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i);
  if (jsonLdAuthor?.[1]) return cleanupMaker(decodeHtmlEntities(jsonLdAuthor[1]));

  const byline = htmlText.match(/\bby\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/);
  if (byline?.[1]) return cleanupMaker(decodeHtmlEntities(byline[1]));

  return "";
}

async function extractRecipeRecord(itemUrl, fallbackMaker, fallbackTitle, sourceLabel) {
  const text = await fetchText(itemUrl);
  if (!text) return null;

  const measuredRecipe = extractMeasuredRecipeFromHtml(text);
  if (measuredRecipe.length < 3) return null;

  const title = extractTitleFromHtml(text, fallbackTitle);
  const maker = extractMakerFromHtml(text) || fallbackMaker;
  const description =
    extractDescriptionFromHtml(text) || "Measured glaze recipe discovered automatically from a source page.";
  const firingCone = extractConeFromText(stripTags(text));

  return {
    title,
    maker,
    description,
    firingCone,
    recipe: measuredRecipe,
    ingredients: measuredRecipe.map((item) => item.name),
  };
}

async function discoverGlazes() {
  await fs.mkdir(incomingDir, { recursive: true });

  const cfg = asObject(await readJson(configFile, {}));
  const feeds = asArray(cfg.feeds);
  const maxCandidatesPerRun = Number(cfg.maxCandidatesPerRun ?? 30);

  const live = asArray(await readJson(glazesFile, []));
  const knownRefs = new Set(live.map((item) => String(item.sourceRef ?? "").toLowerCase()));

  const discovered = [];

  for (const feed of feeds) {
    const name = feed?.name;
    const url = feed?.url;
    const type = feed?.type;
    const defaultMaker = cleanupMaker(feed?.defaultMaker || name || "Unknown maker");
    const includePathContains = asArray(feed?.includePathContains)
      .map((value) => String(value).toLowerCase().trim())
      .filter(Boolean);
    const allowDomains = asArray(feed?.allowDomains).map((d) => String(d).toLowerCase().replace(/^www\./, ""));
    if (!name || !url || !type) continue;

    const text = await fetchText(url);
    if (!text) continue;

    const urls = pickUrls(text, type, url);
    for (const itemUrl of urls) {
      const host = toHostname(itemUrl);
      if (!host) continue;
      if (allowDomains.length > 0 && !allowDomains.some((allowed) => host.endsWith(allowed))) continue;
      if (includePathContains.length > 0) {
        const normalizedUrl = itemUrl.toLowerCase();
        const matchesPathFilter = includePathContains.some((segment) => normalizedUrl.includes(segment));
        if (!matchesPathFilter) continue;
      }

      const ref = toTitle(itemUrl).toLowerCase();
      if (knownRefs.has(ref)) continue;
      if (discovered.some((d) => d.sourceRef === ref)) continue;

      const extracted = await extractRecipeRecord(itemUrl, defaultMaker, toTitle(itemUrl), name);
      if (!extracted) continue;

      const canonicalRef = `${host}:${new URL(itemUrl).pathname}`.toLowerCase();
      if (knownRefs.has(canonicalRef)) continue;
      if (discovered.some((d) => d.sourceRef === canonicalRef)) continue;

      discovered.push({
        id: toId(canonicalRef),
        name: extracted.title,
        description: extracted.description,
        img: "/TCRP%20Logo_2.png",
        finish: "Glossy",
        color: "Unspecified",
        ingredients: extracted.ingredients,
        recipe: extracted.recipe,
        firingCone: extracted.firingCone,
        sourceLabel: name,
        sourceRef: canonicalRef,
        maker: extracted.maker,
        available: true,
      });

      if (discovered.length >= maxCandidatesPerRun) break;
    }

    if (discovered.length >= maxCandidatesPerRun) break;
  }

  if (discovered.length === 0) {
    console.log("[glaze-discover] No new glaze candidates found.");
    return;
  }

  const outFile = path.join(incomingDir, `glaze-discovery-${nowStamp()}.json`);
  await fs.writeFile(outFile, `${JSON.stringify({ glazes: discovered }, null, 2)}\n`, "utf8");
  console.log(`[glaze-discover] Wrote ${discovered.length} glaze candidates to ${path.basename(outFile)}`);
}

discoverGlazes().catch((error) => {
  console.error("[glaze-discover] Failed", error);
  process.exit(1);
});
