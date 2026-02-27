import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dbDir = path.join(rootDir, "app", "glazes", "database");
const incomingDir = path.join(dbDir, "incoming");
const processedDir = path.join(incomingDir, "processed");
const glazesFile = path.join(dbDir, "glazes.data.json");

function asArray(value) {
  return Array.isArray(value) ? value : [];
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

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function ingestGlazes() {
  await fs.mkdir(incomingDir, { recursive: true });
  await fs.mkdir(processedDir, { recursive: true });

  const entries = await fs.readdir(incomingDir, { withFileTypes: true });
  const queueFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => entry.name);

  if (queueFiles.length === 0) {
    console.log("[glaze-ingest] No queued glaze files.");
    return;
  }

  const live = asArray(await readJson(glazesFile, []));
  const byId = new Map(live.map((item) => [item.id, item]));

  for (const fileName of queueFiles) {
    const filePath = path.join(incomingDir, fileName);
    const payload = await readJson(filePath, { glazes: [] });
    const incoming = asArray(payload.glazes);

    for (const glaze of incoming) {
      if (!glaze?.id || !glaze?.name) continue;
      const existing = byId.get(glaze.id);
      byId.set(glaze.id, {
        ...existing,
        ...glaze,
        img: glaze.img || existing?.img || "/TCRP%20Logo_2.png",
        sourceLabel: glaze.sourceLabel || existing?.sourceLabel || "Glazy",
        recipe: asArray(glaze.recipe).length > 0 ? glaze.recipe : asArray(existing?.recipe),
        variations: asArray(glaze.variations).length > 0 ? glaze.variations : asArray(existing?.variations),
        maker: glaze.maker || existing?.maker || glaze.sourceLabel || existing?.sourceLabel || "Unknown maker",
        available:
          glaze.available !== false &&
          (asArray(glaze.recipe).length > 0 ||
            asArray(existing?.recipe).length > 0 ||
            asArray(glaze.variations).some((variation) => asArray(variation?.recipe).length > 0) ||
            asArray(existing?.variations).some((variation) => asArray(variation?.recipe).length > 0)),
      });
    }

    const processedName = `${fileName.replace(/\.json$/i, "")}.${nowStamp()}.processed.json`;
    await fs.rename(filePath, path.join(processedDir, processedName));
  }

  await writeJson(glazesFile, Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name)));
  console.log(`[glaze-ingest] Processed ${queueFiles.length} file(s). Live glazes=${byId.size}`);
}

ingestGlazes().catch((error) => {
  console.error("[glaze-ingest] Failed", error);
  process.exit(1);
});
