import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const queuePath = path.join(rootDir, 'app/glazes/database/glazy-seed-queue.data.json');
const crawlStatePath = path.join(rootDir, 'app/glazes/database/.glazy-crawl-state.json');

const GLAZY_BASE = 'https://glazy.org';
const DELAY_MS = 500; // 500ms between requests
const BATCH_SIZE = 100; // Recipes per crawl session
const TARGET = 5000;

let crawlState = { lastPage: 1, recipesAdded: 0, totalFetched: 0 };

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadState() {
  try {
    crawlState = JSON.parse(await fs.readFile(crawlStatePath, 'utf8'));
  } catch {
    crawlState = { lastPage: 1, recipesAdded: 0, totalFetched: 0 };
  }
}

async function saveState() {
  await fs.writeFile(crawlStatePath, JSON.stringify(crawlState, null, 2) + '\n');
}

async function fetchPage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error.message);
    return null;
  }
}

function extractRecipeLinks(html) {
  // Parse recipe listing page to find recipe detail URLs
  const matches = html.match(/href="(\/recipes\/\d+)"/g) || [];
  return [...new Set(matches.map((m) => m.replace(/href="|"/g, '')))];
}

function parseRecipeDetails(html, recipeId) {
  // Extract recipe name
  const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const name = nameMatch ? nameMatch[1].trim() : `Recipe ${recipeId}`;

  // Extract maker
  const makerMatch = html.match(/by\s+<a[^>]*>([^<]+)<\/a>/);
  const maker = makerMatch ? makerMatch[1].trim() : 'Unknown';

  // Extract ingredients (look for recipe table rows)
  const ingredientMatches = html.match(/<td[^>]*>([^<]+)<\/td><td[^>]*>([^<]+)<\/td>/g) || [];
  const recipeRows = ingredientMatches.slice(0, 20).map((match) => {
    const cells = match.match(/<td[^>]*>([^<]+)<\/td>/g);
    if (cells && cells.length >= 2) {
      const ingredient = cells[0].replace(/<[^>]+>/g, '').trim();
      const amount = cells[1].replace(/<[^>]+>/g, '').trim();
      return `${ingredient} | ${amount}`;
    }
    return null;
  }).filter(Boolean);

  // Need at least 3 ingredients to be valid
  if (recipeRows.length < 3) return null;

  return {
    id: recipeId,
    name,
    maker,
    recipeRows,
  };
}

async function crawlRecipeDetail(recipeId) {
  const url = `${GLAZY_BASE}/recipes/${recipeId}`;
  const html = await fetchPage(url);
  if (!html) return null;

  const recipe = parseRecipeDetails(html, recipeId);
  await sleep(DELAY_MS);
  return recipe;
}

async function crawlRecipeListings(startPage) {
  const recipes = [];
  let page = startPage;
  let lastValidPage = startPage;

  while (recipes.length < BATCH_SIZE) {
    const url = `${GLAZY_BASE}/recipes?page=${page}&per_page=20`;
    console.log(`[glazy-crawl] Fetching listing page ${page}...`);

    const html = await fetchPage(url);
    if (!html) {
      console.log(`[glazy-crawl] Reached end at page ${page}`);
      break;
    }

    const links = extractRecipeLinks(html);
    if (links.length === 0) {
      console.log(`[glazy-crawl] No recipes found on page ${page}, stopping.`);
      break;
    }

    lastValidPage = page;

    // Crawl individual recipes
    for (const link of links) {
      if (recipes.length >= BATCH_SIZE) break;

      const recipeId = parseInt(link.split('/').pop());
      const recipe = await crawlRecipeDetail(recipeId);

      if (recipe) {
        recipes.push(recipe);
        process.stdout.write(`\r[glazy-crawl] Collected ${recipes.length}/${BATCH_SIZE} recipes`);
      }
    }

    page += 1;
    await sleep(DELAY_MS);
  }

  console.log(`\n[glazy-crawl] Collected ${recipes.length} recipes`);
  return { recipes, nextPage: lastValidPage + 1 };
}

async function transformAndMerge(recipes) {
  // Load existing queue
  let queue;
  try {
    queue = JSON.parse(await fs.readFile(queuePath, 'utf8'));
  } catch {
    queue = { autoSkipReview: true, recipes: [] };
  }

  if (!Array.isArray(queue.recipes)) queue.recipes = [];
  queue.autoSkipReview = true;

  const byId = new Map(queue.recipes.map((r) => [Number(r.recipeId), r]));
  let added = 0;

  for (const recipe of recipes) {
    const id = Number(recipe.id);
    if (!byId.has(id)) {
      byId.set(id, {
        enabled: true,
        recipeId: recipe.id,
        name: recipe.name,
        maker: recipe.maker,
        firingCone: 'Unknown',
        finish: 'Glossy',
        color: 'Unspecified',
        description: 'Glaze recipe crawled from Glazy.',
        recipeRows: recipe.recipeRows,
      });
      added += 1;
    }
  }

  queue.recipes = Array.from(byId.values()).sort((a, b) => Number(a.recipeId) - Number(b.recipeId));

  await fs.writeFile(queuePath, JSON.stringify(queue, null, 2) + '\n');

  return { added, total: queue.recipes.length };
}

async function crawl() {
  await loadState();

  console.log(`[glazy-crawl] Starting crawl session`);
  console.log(`[glazy-crawl] Current state: page=${crawlState.lastPage}, added=${crawlState.recipesAdded}/${TARGET}`);
  console.log(`[glazy-crawl] Crawling up to ${BATCH_SIZE} recipes with ${DELAY_MS}ms delays...`);

  const { recipes, nextPage } = await crawlRecipeListings(crawlState.lastPage);

  if (recipes.length > 0) {
    const result = await transformAndMerge(recipes);
    crawlState.recipesAdded += result.added;
    crawlState.totalFetched += recipes.length;
    crawlState.lastPage = nextPage;

    console.log(`[glazy-crawl] ✓ Added ${result.added} new recipes`);
    console.log(`[glazy-crawl] Queue total: ${result.total} recipes`);
    console.log(`[glazy-crawl] Progress: ${crawlState.recipesAdded}/${TARGET}`);

    await saveState();

    if (crawlState.recipesAdded < TARGET) {
      console.log(`[glazy-crawl] Run again later to continue crawling.`);
    } else {
      console.log(`[glazy-crawl] ✓ Target reached!`);
    }
  } else {
    console.log(`[glazy-crawl] No new recipes found.`);
  }
}

crawl().catch((error) => {
  console.error('[glazy-crawl] Error:', error.message);
  process.exit(1);
});
