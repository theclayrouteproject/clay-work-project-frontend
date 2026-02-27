import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const dbDir = path.join(rootDir, "app", "market", "database");
const incomingDir = path.join(dbDir, "incoming");
const processedDir = path.join(incomingDir, "processed");
const itemsFile = path.join(dbDir, "items.data.json");
const curateScript = path.join(rootDir, "scripts", "market-curate.mjs");

const WATCH_FLAG = process.argv.includes("--watch");

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function toId(name, sourceUrl) {
  const base = (name || sourceUrl || "item")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return base || `item-${Date.now()}`;
}

function pickImageUrl(item, existingImageUrl) {
  const candidates = [
    item?.imageUrl,
    item?.productPhoto,
    item?.productPhotoUrl,
    item?.photo,
    item?.photoUrl,
    item?.image,
    item?.img,
    existingImageUrl,
  ];

  for (const value of candidates) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    return trimmed;
  }

  return "/TCRP%20Logo_2.png";
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

async function processQueueOnce() {
  await fs.mkdir(incomingDir, { recursive: true });
  await fs.mkdir(processedDir, { recursive: true });

  const entries = await fs.readdir(incomingDir, { withFileTypes: true });
  const queueFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => entry.name);

  if (queueFiles.length === 0) {
    console.log("[market-ingest] No queued market files.");
    return 0;
  }

  const liveItems = asArray(await readJson(itemsFile, []));
  const byKey = new Map();

  for (const item of liveItems) {
    const key = item.sourceUrl || item.id;
    if (!key) continue;
    byKey.set(key, item);
  }

  for (const fileName of queueFiles) {
    const filePath = path.join(incomingDir, fileName);
    const payload = await readJson(filePath, { items: [] });
    const incomingItems = asArray(payload.items);

    for (const item of incomingItems) {
      if (!item?.sourceUrl || !item?.name) continue;
      const key = item.sourceUrl;
      const existing = byKey.get(key);
      const normalized = {
        id: existing?.id ?? item.id ?? toId(item.name, item.sourceUrl),
        name: item.name,
        category: item.category ?? existing?.category ?? "Tools",
        subcategory: item.subcategory ?? existing?.subcategory ?? null,
        description:
          item.description ??
          existing?.description ??
          "Supplier listing for ceramics workflow. Review specifications and compatibility before production use.",
        region: item.region ?? existing?.region ?? "Global",
        supplier: item.supplier ?? existing?.supplier ?? "Unknown Supplier",
        currency: item.currency ?? existing?.currency ?? "USD",
        price: Number(item.price ?? existing?.price ?? 0),
        unit: item.unit ?? existing?.unit ?? "unit",
        minOrderQty: item.minOrderQty ?? existing?.minOrderQty ?? "1 unit",
        available: true,
        availabilityStatus: item.availabilityStatus ?? existing?.availabilityStatus ?? "in-stock",
        stockStatus: item.stockStatus ?? existing?.stockStatus ?? "Stock status to confirm with supplier",
        leadTime: item.leadTime ?? existing?.leadTime ?? "Lead time to confirm",
        applications: item.applications ?? existing?.applications ?? ["Studio production", "Testing and trials"],
        compatibleWith:
          item.compatibleWith ?? existing?.compatibleWith ?? ["Stoneware workflows", "Porcelain workflows"],
        certifications: item.certifications ?? existing?.certifications ?? ["Supplier documentation required"],
        safetyNotes: item.safetyNotes ?? existing?.safetyNotes ?? ["Review SDS and handling instructions before use"],
        packageOptions: item.packageOptions ?? existing?.packageOptions ?? ["Standard supplier packaging"],
        procurementNotes:
          item.procurementNotes ??
          existing?.procurementNotes ??
          "Confirm pricing, MOQ, and payment terms with supplier before ordering.",
        shippingNotes:
          item.shippingNotes ??
          existing?.shippingNotes ??
          "Shipping cost and delivery time vary by region and carrier.",
        supportNotes:
          item.supportNotes ??
          existing?.supportNotes ??
          "Contact supplier technical support for compatibility checks and substitutions.",
        specifications:
          item.specifications ??
          existing?.specifications ??
          [
            { label: "Product Type", value: "Supplier listing" },
            { label: "Verification", value: "Pending studio validation" },
          ],
        sourceUrl: item.sourceUrl,
        imageUrl: pickImageUrl(item, existing?.imageUrl),
        lastSeenAt: new Date().toISOString().slice(0, 10),
        lastVerifiedAt: existing?.lastVerifiedAt ?? null,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      byKey.set(key, normalized);
    }

    const processedName = `${fileName.replace(/\.json$/i, "")}.${nowStamp()}.processed.json`;
    await fs.rename(filePath, path.join(processedDir, processedName));
  }

  await writeJson(itemsFile, Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name)));
  console.log(`[market-ingest] Processed ${queueFiles.length} file(s). Live items=${byKey.size}`);
  return queueFiles.length;
}

async function runCurate() {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [curateScript], {
      cwd: rootDir,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`[market-ingest] Curate failed with exit code ${code ?? "unknown"}`));
    });
  });
}

let processing = false;

async function processCycle() {
  if (processing) return;
  processing = true;

  try {
    const processedCount = await processQueueOnce();
    if (processedCount > 0) {
      await runCurate();
    }
  } finally {
    processing = false;
  }
}

async function runOnce() {
  await processCycle();
}

async function runWatch() {
  await processCycle();
  console.log(`[market-ingest] Watching ${incomingDir}`);

  fs.watch(incomingDir, async (eventType, fileName) => {
    if (!fileName || !fileName.endsWith(".json")) return;
    if (eventType !== "rename" && eventType !== "change") return;
    await processCycle();
  });
}

if (WATCH_FLAG) {
  runWatch().catch((error) => {
    console.error("[market-ingest] Worker failed", error);
    process.exit(1);
  });
} else {
  runOnce().catch((error) => {
    console.error("[market-ingest] Failed", error);
    process.exit(1);
  });
}
