import Link from "next/link";
import { promises as fs } from "node:fs";
import path from "node:path";

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
  sourceUrl?: string;
};

type VendorRating = {
  name: string;
  city?: string;
  state?: string;
  rating?: number;
  reviewCount?: number;
  reviewSource?: string;
};

type Props = {
  params: Promise<{ vendor: string }>;
};

export const dynamic = "force-dynamic";

function fromVendorSlug(value: string) {
  return decodeURIComponent(value).trim().toLowerCase();
}

function normalizeVendorKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function starText(rating?: number) {
  if (!rating) return "☆☆☆☆☆";
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

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

export default async function VendorListingsPage({ params }: Props) {
  const { vendor } = await params;
  const vendorSlug = fromVendorSlug(vendor);
  const logoFallback = "/TCRP%20Logo_2.png";
  const allowedCategories = new Set(["Tools", "Machines", "Kilns"]);
  const ratingMap = new Map((await loadVendorRatings()).map((entry) => [normalizeVendorKey(entry.name), entry]));

  const activeItems = (await loadMarketItems()).filter(
    (item) =>
      item.available !== false &&
      item.availabilityStatus !== "deprecated" &&
      allowedCategories.has(item.category),
  );

  const vendorItems = activeItems.filter(
    (item) => (item.supplier || "Unknown Supplier").trim().toLowerCase() === vendorSlug,
  );

  const vendorName = vendorItems[0]?.supplier || decodeURIComponent(vendor);
  const vendorRating = ratingMap.get(normalizeVendorKey(vendorName));

  if (vendorItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center justify-center px-4">
        <p className="text-lg">No active listings found for this vendor.</p>
        <Link
          href="/market"
          className="mt-6 bg-[#A44E32] text-[#F2E3C7] px-6 py-2 rounded-md hover:bg-[#4A2F1C] hover:text-[#F2E3C7] transition-all"
        >
          Back to Market Vendors
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center pt-28 pb-20 px-4">
      <h1 className="text-5xl font-bold mb-4">{vendorName}</h1>
      <p className="text-sm text-[#F2E6C8]/85 mb-2">
        {starText(vendorRating?.rating)} {vendorRating?.rating ? `${vendorRating.rating.toFixed(1)} (${vendorRating.reviewCount ?? 0} reviews)` : "No rating yet"}
      </p>
      {vendorRating?.city && vendorRating?.state ? (
        <p className="text-sm text-[#F2E6C8]/80 mb-2">{vendorRating.city}, {vendorRating.state}</p>
      ) : null}
      <p className="text-sm text-[#F2E6C8]/85 mb-8 text-center max-w-3xl">
        Active sale listings from this vendor.
      </p>

      <section className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl w-full">
        {vendorItems.map((item) => (
          <div
            key={item.id}
            className="p-6 bg-[#3B2A1F]/80 rounded-xl shadow-lg border border-[#A44E32]/40 flex flex-col items-center transition-transform hover:scale-105"
          >
            <img
              src={item.imageUrl || logoFallback}
              alt={item.name}
              className="rounded-lg mb-4 w-full h-64 object-cover"
            />
            <h2 className="text-2xl font-semibold mb-2 text-[#A44E32] text-center">{item.name}</h2>
            <p className="text-xs text-[#F2E6C8]/80 mb-2 text-center">{item.category}</p>
            <p className="text-xs text-[#F2E6C8]/80 mb-2 text-center">{item.state ?? "US"} • {item.condition ?? "New"}</p>
            <p className="text-xs text-[#F2E6C8]/75 mb-2 text-center">
              {item.stockStatus ?? item.availabilityStatus ?? "Availability unknown"}
              {item.leadTime ? ` • ${item.leadTime}` : ""}
            </p>
            <p className="text-xl text-[#F2E3C7] mb-3">
              {item.price != null ? `${item.currency ?? "USD"} ${item.price}` : "Price on supplier site"}
            </p>
            <Link
              href={`/market/${item.id}`}
              className="bg-[#A44E32] text-[#F2E3C7] px-4 py-2 rounded-md hover:bg-[#4A2F1C] hover:text-[#F2E3C7] transition-all"
            >
              View Listing
            </Link>
          </div>
        ))}
      </section>

      <Link
        href="/market"
        className="mt-10 bg-[#A44E32] text-[#F2E3C7] px-6 py-2 rounded-md hover:bg-[#4A2F1C] hover:text-[#F2E3C7] transition-all"
      >
        Back to Market Vendors
      </Link>
    </main>
  );
}
