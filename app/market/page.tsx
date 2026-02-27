import { promises as fs } from "node:fs";
import path from "node:path";
import MarketMapClient, { type StateListing, type StateStore } from "./MarketMapClient";

type MarketItem = {
  id: string;
  name: string;
  category: "Ingredients" | "Clays" | "Tools" | "Machines" | "Kilns";
  subcategory?: string;
  description?: string;
  region?: string;
  supplier?: string;
  state?: string;
  condition?: "New" | "Used" | "Refurbished";
  currency?: string;
  price?: number | null;
  unit?: string;
  imageUrl?: string;
  available?: boolean;
  availabilityStatus?: string;
  stockStatus?: string;
  leadTime?: string;
  applications?: string[];
  compatibleWith?: string[];
  certifications?: string[];
  safetyNotes?: string[];
  packageOptions?: string[];
  procurementNotes?: string;
  shippingNotes?: string;
  supportNotes?: string;
  minOrderQty?: string;
  specifications?: Array<{ label: string; value: string }>;
  sourceUrl?: string;
};

type VendorRating = {
  name: string;
  website?: string;
  city?: string;
  state?: string;
  rating?: number;
  reviewCount?: number;
  reviewSource?: string;
};

export const dynamic = "force-dynamic";

async function loadMarketItems(): Promise<MarketItem[]> {
  try {
    const filePath = path.join(process.cwd(), "app", "market", "database", "items.data.json");
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as MarketItem[];
  } catch {
    return [];
  }
}

async function loadVendorRatings(): Promise<VendorRating[]> {
  try {
    const filePath = path.join(process.cwd(), "app", "market", "database", "vendor-ratings.data.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { vendors?: VendorRating[] };
    return Array.isArray(parsed.vendors) ? parsed.vendors : [];
  } catch {
    return [];
  }
}

export default async function Market() {
  const logoFallback = "/TCRP%20Logo_2.png";
  const vendorRatings = await loadVendorRatings();
  const allowedCategories = new Set(["Tools", "Machines", "Kilns", "Clays", "Ingredients"]);
  const items = (await loadMarketItems()).filter(
    (item) =>
      item.available !== false &&
      item.availabilityStatus !== "deprecated" &&
      allowedCategories.has(item.category) &&
      item.region === "US",
  );

  const stateListings: Record<string, StateListing[]> = {};
  for (const item of items) {
    const state = String(item.state ?? "").toUpperCase().trim();
    if (!state) continue;
    if (!stateListings[state]) stateListings[state] = [];
    stateListings[state].push({
      id: item.id,
      name: item.name,
      category: item.category,
      supplier: item.supplier ?? "Unknown Supplier",
      condition: item.condition ?? "New",
      price: item.price ?? null,
      currency: item.currency ?? "USD",
      imageUrl: item.imageUrl || logoFallback,
    });
  }

  for (const state of Object.keys(stateListings)) {
    stateListings[state].sort((a, b) => a.name.localeCompare(b.name));
  }

  const stateStores: Record<string, StateStore[]> = {};
  for (const vendor of vendorRatings) {
    const state = String(vendor.state ?? "").toUpperCase().trim();
    if (!state) continue;
    if (!stateStores[state]) stateStores[state] = [];
    stateStores[state].push({
      name: vendor.name,
      website: vendor.website,
      city: vendor.city,
      state,
      rating: vendor.rating,
      reviewCount: vendor.reviewCount,
      reviewSource: vendor.reviewSource,
    });
  }

  for (const state of Object.keys(stateStores)) {
    stateStores[state].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name));
  }

  return (
    <MarketMapClient stateStores={stateStores} stateListings={stateListings} />
  );
}
