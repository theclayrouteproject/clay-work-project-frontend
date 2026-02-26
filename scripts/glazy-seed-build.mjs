import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dbDir = path.join(rootDir, "app", "glazes", "database");
const queueFile = path.join(dbDir, "glazy-seed-queue.data.json");
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

function normalizeName(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRowString(rowString) {
  const text = normalizeName(rowString);
  if (!text) return null;

  const amountMatch = text.match(/([0-9]{1,3}(?:\.[0-9]{1,3})?)\s*(%|g)?\s*$/i);
  if (!amountMatch) return null;

  const amount = Number(amountMatch[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const unit = amountMatch[2]?.toLowerCase() === "g" ? "g" : "%";
  const ingredientText = text.slice(0, amountMatch.index).replace(/[|:\-–—]\s*$/, "").trim();
  const name = normalizeName(ingredientText);

  if (!name) return null;
  if (/^total\b/i.test(name)) return null;
  if (/^recipe\b/i.test(name)) return null;

  return { name, amount, unit };
}

function parseRecipeRows(value) {
  const rows = [];

  for (const row of asArray(value)) {
    if (typeof row === "string") {
      const parsed = parseRowString(row);
      if (parsed) rows.push(parsed);
      continue;
    }

    const obj = asObject(row);
    const name = normalizeName(obj.name);
    const amount = Number(obj.amount);
    if (!name || !Number.isFinite(amount) || amount <= 0) continue;
    if (/^total\b/i.test(name)) continue;

    rows.push({
      name,
      amount,
      unit: String(obj.unit).toLowerCase() === "g" ? "g" : "%",
    });
  }

  const deduped = new Map();
  for (const row of rows) {
    const key = row.name.toLowerCase();
    if (!deduped.has(key)) deduped.set(key, row);
  }

  return Array.from(deduped.values());
}

function toGlazeId(recipeId) {
  return `glazy-org-recipes-${String(recipeId).replace(/[^0-9]/g, "")}`;
}

function toSourceRef(recipeId) {
  return `glazy.org:/recipes/${String(recipeId).replace(/[^0-9]/g, "")}`;
}

function toDefaultDescription() {
  return "Measured glaze recipe imported from Glazy seed queue.";
}

async function buildSeedBatch() {
  const args = new Set(process.argv.slice(2));
  const force = args.has("--force");
  const cliAutoSkipReview = args.has("--auto-skip-review");
  const envAutoSkipReview =
    String(process.env.GLAZE_AUTO_SKIP_REVIEW ?? "").toLowerCase() === "1" ||
    String(process.env.GLAZE_AUTO_SKIP_REVIEW ?? "").toLowerCase() === "true";

  await fs.mkdir(incomingDir, { recursive: true });

  const queue = asObject(await readJson(queueFile, { recipes: [] }));
  const queueAutoSkipReview = queue.autoSkipReview === true;
  const autoSkipReview = cliAutoSkipReview || envAutoSkipReview || queueAutoSkipReview;
  const queueRecipes = asArray(queue.recipes);

  if (queueRecipes.length === 0) {
    console.log("[glazy-seed-build] No queue entries found.");
    return;
  }

  const liveGlazes = asArray(await readJson(glazesFile, []));
  const knownRefs = new Set(liveGlazes.map((item) => String(item?.sourceRef ?? "").toLowerCase()));

  const built = [];
  let skippedDisabled = 0;
  let skippedInvalid = 0;
  let skippedExisting = 0;

  for (const entry of queueRecipes) {
    const item = asObject(entry);
    const enabled = autoSkipReview || item.enabled !== false;

    if (!enabled) {
      skippedDisabled += 1;
      continue;
    }

    const recipeIdRaw = String(item.recipeId ?? "").trim();
    const recipeId = recipeIdRaw.replace(/[^0-9]/g, "");
    const name = normalizeName(item.name);
    const maker = normalizeName(item.maker) || "Unknown maker";
    const sourceRef = toSourceRef(recipeId);

    if (!recipeId || !name) {
      skippedInvalid += 1;
      continue;
    }

    if (!force && knownRefs.has(sourceRef.toLowerCase())) {
      skippedExisting += 1;
      continue;
    }

    const recipe = parseRecipeRows(item.recipeRows);
    if (recipe.length < 3) {
      skippedInvalid += 1;
      continue;
    }

    const glaze = {
      id: toGlazeId(recipeId),
      name,
      description: normalizeName(item.description) || toDefaultDescription(),
      img: "/TCRP%20Logo_2.png",
      finish: normalizeName(item.finish) || "Glossy",
      color: normalizeName(item.color) || "Unspecified",
      ingredients: recipe.map((row) => row.name),
      recipe,
      firingCone: normalizeName(item.firingCone) || "Cone 6",
      sourceLabel: "Glazy",
      sourceRef,
      maker,
      available: true,
    };

    built.push(glaze);
  }

  if (built.length === 0) {
    console.log(
      `[glazy-seed-build] No valid new entries built (disabled=${skippedDisabled}, invalid=${skippedInvalid}, existing=${skippedExisting}).`,
    );
    return;
  }

  const outFile = path.join(incomingDir, `glaze-discovery-glazy-seeded-${nowStamp()}.json`);
  await fs.writeFile(outFile, `${JSON.stringify({ glazes: built }, null, 2)}\n`, "utf8");

  console.log(
    `[glazy-seed-build] Wrote ${built.length} glaze entries to ${path.basename(outFile)} (disabled=${skippedDisabled}, invalid=${skippedInvalid}, existing=${skippedExisting}, force=${force}, autoSkipReview=${autoSkipReview}).`,
  );
}

buildSeedBatch().catch((error) => {
  console.error("[glazy-seed-build] Failed", error);
  process.exit(1);
});
