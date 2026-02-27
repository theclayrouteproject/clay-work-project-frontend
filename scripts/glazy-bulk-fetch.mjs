import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const queuePath = path.join(rootDir, 'app/glazes/database/glazy-seed-queue.data.json');

// Glazy API endpoint for recipes
const GLAZY_API = 'https://glazy.org/api/recipes';
const BATCH_SIZE = 100;
const MAX_RECIPES = 5000;

async function fetchRecipes(page = 1, limit = BATCH_SIZE) {
  const url = `${GLAZY_API}?page=${page}&limit=${limit}&sort=-id`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch page ${page}:`, error.message);
    return null;
  }
}

function isValidRecipe(recipe) {
  // Must have at least 3 ingredients
  const ingredients = recipe.ingredients || [];
  if (!Array.isArray(ingredients) || ingredients.length < 3) return false;

  // Must have basic info
  if (!recipe.id || !recipe.name) return false;

  return true;
}

function transformRecipe(recipe) {
  const ingredientList = (recipe.ingredients || []).map((ing) => {
    const amount = ing.amount || ing.percentage || 0;
    return `${ing.name || ing} | ${Number(amount).toFixed(2)}`;
  });

  return {
    enabled: true,
    recipeId: recipe.id,
    name: recipe.name,
    maker: recipe.maker || recipe.createdByUser?.name || 'Unknown',
    firingCone: recipe.targetCone?.name || 'Cone 6',
    finish: recipe.surfaceType?.name || 'Glossy',
    color: recipe.primaryColor?.name || 'Unspecified',
    description: recipe.notes || 'Glaze recipe imported from Glazy API.',
    recipeRows: ingredientList,
  };
}

async function fetchAndPopulateQueue() {
  console.log(`[glazy-bulk-fetch] Starting bulk fetch from Glazy API...`);
  console.log(`[glazy-bulk-fetch] Target: ${MAX_RECIPES} recipes`);

  let allRecipes = [];
  let page = 1;
  let totalFetched = 0;

  // Fetch recipes in batches
  while (totalFetched < MAX_RECIPES) {
    const data = await fetchRecipes(page, BATCH_SIZE);
    if (!data?.list || data.list.length === 0) {
      console.log(`[glazy-bulk-fetch] Reached end of API at page ${page}`);
      break;
    }

    const validRecipes = data.list.filter(isValidRecipe).map(transformRecipe);
    allRecipes.push(...validRecipes);
    totalFetched += validRecipes.length;

    console.log(`[glazy-bulk-fetch] Page ${page}: fetched ${validRecipes.length} valid recipes (total: ${totalFetched})`);

    page += 1;
    if (totalFetched >= MAX_RECIPES) break;

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`[glazy-bulk-fetch] Fetched ${allRecipes.length} total valid recipes`);

  // Load existing queue
  let queue;
  try {
    queue = JSON.parse(await fs.readFile(queuePath, 'utf8'));
  } catch {
    queue = { autoSkipReview: true, recipes: [] };
  }

  if (!Array.isArray(queue.recipes)) queue.recipes = [];
  queue.autoSkipReview = true;

  // Merge with existing, deduplicate by recipeId
  const byId = new Map(queue.recipes.map((r) => [Number(r.recipeId), r]));
  let added = 0;
  let updated = 0;

  for (const recipe of allRecipes) {
    const id = Number(recipe.recipeId);
    if (byId.has(id)) {
      updated += 1;
    } else {
      added += 1;
    }
    byId.set(id, recipe);
  }

  queue.recipes = Array.from(byId.values()).sort((a, b) => Number(a.recipeId) - Number(b.recipeId));

  // Write to file
  await fs.writeFile(queuePath, JSON.stringify(queue, null, 2) + '\n');

  console.log(`[glazy-bulk-fetch] wrote ${queue.recipes.length} recipes to queue (added=${added}, updated=${updated})`);
  console.log(`[glazy-bulk-fetch] Queue ready for ingestion`);
}

fetchAndPopulateQueue().catch((error) => {
  console.error('[glazy-bulk-fetch] Failed:', error.message);
  process.exit(1);
});
