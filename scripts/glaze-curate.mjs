import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dbDir = path.join(rootDir, "app", "glazes", "database");
const glazesFile = path.join(dbDir, "glazes.data.json");
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

const blockedIngredientPattern =
  /menu|testing|test\b|tools\b|bisque|tile|self\s*hardening|air\s*dry|modeling|clays\s+clays|recipe ingredients|newsletter|read more/i;

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
  "frit",
  "oxide",
  "carbonate",
  "stain",
  "ash",
  "spodumene",
  "grolleg",
  "petalite",
  "custer",
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
  "flint",
  "ilmenite",
];

function looksLikeCeramicIngredient(value) {
  const normalized = String(value ?? "").toLowerCase();
  return ceramicIngredientKeywords.some((keyword) => normalized.includes(keyword));
}

function classifyRecipeQuality(glaze) {
  const measuredRecipe = asArray(glaze?.recipe).filter(
    (row) => row?.name && Number.isFinite(Number(row?.amount)) && Number(row?.amount) > 0,
  );
  if (measuredRecipe.length >= 3) {
    return { valid: true, reason: null };
  }

  const measuredVariationExists = asArray(glaze?.variations).some((variation) =>
    asArray(variation?.recipe).filter(
      (row) => row?.name && Number.isFinite(Number(row?.amount)) && Number(row?.amount) > 0,
    ).length >= 3,
  );
  if (measuredVariationExists) {
    return { valid: true, reason: null };
  }

  const ingredientNames = asArray(glaze?.ingredients).map((item) => String(item ?? "").trim()).filter(Boolean);
  if (ingredientNames.some((name) => blockedIngredientPattern.test(name))) {
    return { valid: false, reason: "blocked-ingredient-text" };
  }

  if (ingredientNames.some((name) => !looksLikeCeramicIngredient(name))) {
    return { valid: false, reason: "non-ceramic-ingredient-text" };
  }

  return { valid: false, reason: "missing-measured-recipe" };
}

async function curateGlazes() {
  const glazes = asArray(await readJson(glazesFile, []));
  const registry = asObject(await readJson(registryFile, { version: 1, glazes: [] }));

  const regMap = new Map();
  for (const row of asArray(registry.glazes)) {
    if (!row?.id) continue;
    regMap.set(row.id, row);
  }

  const active = [];
  const deprecated = [];

  for (const glaze of glazes) {
    const hasCore = Boolean(glaze?.id && glaze?.name && glaze?.firingCone && glaze?.sourceRef);
    const quality = classifyRecipeQuality(glaze);
    const isActive = glaze.available !== false && hasCore && quality.valid;

    if (isActive) {
      active.push({ ...glaze, available: true, img: glaze.img || "/TCRP%20Logo_2.png" });
    } else {
      deprecated.push({
        id: glaze.id ?? "unknown",
        name: glaze.name ?? "Unknown",
        reason: !hasCore ? "missing-core-fields" : quality.reason || "marked-unavailable",
        sourceRef: glaze.sourceRef ?? null,
      });
    }

    regMap.set(glaze.id ?? `unknown-${Math.random()}`, {
      id: glaze.id,
      name: glaze.name,
      sourceRef: glaze.sourceRef,
      sourceLabel: glaze.sourceLabel,
      status: isActive ? "active" : "deprecated",
      updatedAt: new Date().toISOString(),
    });
  }

  await writeJson(glazesFile, active.sort((a, b) => a.name.localeCompare(b.name)));
  await writeJson(registryFile, {
    version: 1,
    updatedAt: new Date().toISOString(),
    glazes: Array.from(regMap.values()).filter((item) => item.id).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
  });
  await writeJson(deprecationsFile, {
    updatedAt: new Date().toISOString(),
    glazes: deprecated,
  });

  console.log(`[glaze-curate] active=${active.length} deprecatedThisRun=${deprecated.length}`);
}

curateGlazes().catch((error) => {
  console.error("[glaze-curate] Failed", error);
  process.exit(1);
});
