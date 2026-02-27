import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const verifyPath = path.join(rootDir, 'app/glazes/verify/VerifyGlazesClient.tsx');
const queuePath = path.join(rootDir, 'app/glazes/database/glazy-seed-queue.data.json');

async function syncVerifyToQueue() {
  const verifyText = await fs.readFile(verifyPath, 'utf8');
  const match = verifyText.match(/const\s+pendingGlazes:\s*PendingGlaze\[\]\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error('Could not locate pendingGlazes array');
  const pendingGlazes = Function(`return (${match[1]});`)();

  const queue = JSON.parse(await fs.readFile(queuePath, 'utf8'));
  if (!Array.isArray(queue.recipes)) queue.recipes = [];
  queue.autoSkipReview = true;

  const byId = new Map(queue.recipes.map((r) => [Number(r.recipeId), r]));
  let added = 0;
  let updated = 0;

  for (const glaze of pendingGlazes) {
    const entry = {
      enabled: true,
      recipeId: glaze.recipeId,
      name: glaze.name,
      maker: glaze.maker,
      firingCone: glaze.firingCone,
      finish: /matt|matte/i.test(glaze.name) ? 'Matte' : 'Glossy',
      color: /pink/i.test(glaze.name) ? 'Pink' : /white/i.test(glaze.name) ? 'White/Cream' : 'Unspecified',
      description: 'Measured glaze recipe imported from Glazy seed queue.',
      recipeRows: glaze.recipe.map((row) => `${row.ingredient} | ${Number(row.amount).toFixed(2)}`),
    };

    if (byId.has(Number(glaze.recipeId))) {
      byId.set(Number(glaze.recipeId), { ...byId.get(Number(glaze.recipeId)), ...entry });
      updated += 1;
    } else {
      byId.set(Number(glaze.recipeId), entry);
      added += 1;
    }
  }

  queue.recipes = Array.from(byId.values()).sort((a, b) => Number(a.recipeId) - Number(b.recipeId));
  await fs.writeFile(queuePath, JSON.stringify(queue, null, 2) + '\n');

  console.log(JSON.stringify({ added, updated, totalQueueRecipes: queue.recipes.length }, null, 2));
}

syncVerifyToQueue().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});
