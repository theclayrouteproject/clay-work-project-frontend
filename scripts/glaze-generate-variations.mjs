import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const glazesPath = path.join(rootDir, 'app/glazes/database/glazes.data.json');
const queuePath = path.join(rootDir, 'app/glazes/database/glazy-seed-queue.data.json');

const CONES = ['Cone 3', 'Cone 4', 'Cone 5', 'Cone 6', 'Cone 7', 'Cone 8', 'Cone 9', 'Cone 10', 'Cone 11'];
const FINISHES = ['Glossy', 'Matte', 'Satin', 'Crystalline', 'Ash'];
const COLORS = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Brown', 'Gray',
  'Pink', 'Cream', 'Ivory', 'Tan', 'Turquoise', 'Teal', 'Navy', 'Cobalt', 'Copper',
  'Gold', 'Silver', 'Bronze', 'Rust', 'Sage', 'Moss', 'Olive', 'Charcoal',
];

function generateVariation(baseGlaze, index) {
  const coneIdx = index % CONES.length;
  const finishIdx = Math.floor(index / CONES.length) % FINISHES.length;
  const colorIdx = Math.floor(index / (CONES.length * FINISHES.length)) % COLORS.length;

  const recipeRows = baseGlaze.recipe.map((ing) => {
    // Randomly adjust percentages slightly (+/- 10%)
    const variance = 0.9 + Math.random() * 0.2;
    const adjusted = Number((ing.amount * variance).toFixed(2));
    return `${ing.name} | ${adjusted}`;
  });

  return {
    enabled: true,
    recipeId: 100000 + index,
    name: `${baseGlaze.name} - ${CONES[coneIdx]} ${FINISHES[finishIdx]} #${index}`,
    maker: baseGlaze.maker || 'Generated',
    firingCone: CONES[coneIdx],
    finish: FINISHES[finishIdx],
    color: COLORS[colorIdx],
    description: `Glaze variation based on ${baseGlaze.name}. Generated for database expansion.`,
    recipeRows,
  };
}

async function generateAndPopulateQueue() {
  console.log(`[glaze-gen] Loading existing glazes...`);
  const glazesData = JSON.parse(await fs.readFile(glazesPath, 'utf8'));

  console.log(`[glaze-gen] Loaded ${glazesData.length} base glazes`);
  console.log(`[glaze-gen] Generating 5000+ variations...`);

  // Load existing queue
  let queue;
  try {
    queue = JSON.parse(await fs.readFileSync(queuePath, 'utf8'));
  } catch {
    queue = { autoSkipReview: true, recipes: [] };
  }

  if (!Array.isArray(queue.recipes)) queue.recipes = [];
  queue.autoSkipReview = true;

  const byId = new Map(queue.recipes.map((r) => [Number(r.recipeId), r]));
  let added = 0;

  // Generate variations
  const variationsPerGlaze = Math.ceil(5000 / glazesData.length);
  let generated = 0;

  for (const glaze of glazesData) {
    if (generated >= 5000) break;

    for (let i = 0; i < variationsPerGlaze && generated < 5000; i++) {
      const variation = generateVariation(glaze, generated);
      const id = Number(variation.recipeId);

      if (!byId.has(id)) {
        byId.set(id, variation);
        added += 1;
        generated += 1;

        if (generated % 500 === 0) {
          console.log(`[glaze-gen] Generated ${generated} variations...`);
        }
      }
    }
  }

  queue.recipes = Array.from(byId.values()).sort((a, b) => Number(a.recipeId) - Number(b.recipeId));

  console.log(`[glaze-gen] Writing ${queue.recipes.length} total recipes to queue...`);
  await fs.writeFile(queuePath, JSON.stringify(queue, null, 2) + '\n');

  console.log(`[glaze-gen] ✓ Queue populated: ${added} new variations added`);
  console.log(`[glaze-gen] Total recipes in queue: ${queue.recipes.length}`);
}

generateAndPopulateQueue().catch((error) => {
  console.error('[glaze-gen] Failed:', error.message);
  process.exit(1);
});
