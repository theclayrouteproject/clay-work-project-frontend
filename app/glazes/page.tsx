import { promises as fs } from "node:fs";
import path from "node:path";
import type { Glaze } from "./data";
import GlazesClient from "./GlazesClient";

export const dynamic = "force-dynamic";

async function loadGlazes(): Promise<Glaze[]> {
  try {
    const filePath = path.join(process.cwd(), "app", "glazes", "database", "glazes.data.json");
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as Glaze[];
  } catch {
    return [];
  }
}

export default async function Glazes() {
  const data = (await loadGlazes()).filter(
    (entry) =>
      entry.available !== false &&
      ((Array.isArray(entry.recipe) && entry.recipe.length >= 3) ||
        (Array.isArray(entry.variations) &&
          entry.variations.some((variation) => Array.isArray(variation.recipe) && variation.recipe.length >= 3))),
  );
  return <GlazesClient data={data} />;
}
