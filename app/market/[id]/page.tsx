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
  minOrderQty?: string;
  packageOptions?: string[];
  stockStatus?: string;
  leadTime?: string;
  applications?: string[];
  compatibleWith?: string[];
  certifications?: string[];
  safetyNotes?: string[];
  procurementNotes?: string;
  shippingNotes?: string;
  supportNotes?: string;
  specifications?: Array<{ label: string; value: string }>;
  sourceUrl: string;
  imageUrl?: string;
  available?: boolean;
  availabilityStatus?: string;
};

type VendorRating = {
  name: string;
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

function normalizeVendorKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function starText(rating?: number) {
  if (!rating) return "☆☆☆☆☆";
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
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

type Props = {
  params: { id: string };
};

export default async function ItemDetail({ params }: Props) {
  const logoFallback = "/TCRP%20Logo_2.png";
  const ratingMap = new Map((await loadVendorRatings()).map((entry) => [normalizeVendorKey(entry.name), entry]));
  const allowedCategories = new Set(["Tools", "Machines", "Kilns"]);
  const activeItems = (await loadMarketItems()).filter(
    (entry) =>
      entry.available !== false &&
      entry.availabilityStatus !== "deprecated" &&
      allowedCategories.has(entry.category),
  );
  const item = activeItems.find((entry) => entry.id === params.id) ?? null;

  if (!item) {
    return (
      <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex items-center justify-center">
        <p>Listing not found or no longer available.</p>
      </main>
    );
  }

  const vendorRating = ratingMap.get(normalizeVendorKey(item.supplier ?? ""));

  return (
    <main className="min-h-screen bg-[#8D9158] text-[#F2E6C8] flex flex-col items-center pt-28 pb-20 px-4">
      <div className="max-w-3xl w-full bg-[#3B2A1F]/80 rounded-xl shadow-lg border border-[#A44E32]/40 p-6 text-center">
        <img
          src={item.imageUrl || logoFallback}
          alt={item.name}
          className="w-full rounded-lg mb-6 object-cover"
        />
        <h1 className="text-4xl font-bold text-[#A44E32] mb-4">{item.name}</h1>
        <p className="text-sm text-[#F2E6C8]/80 mb-2">
          {item.category}
          {item.subcategory ? ` • ${item.subcategory}` : ""}
        </p>
        <p className="text-sm text-[#F2E6C8]/80 mb-2">
          {item.region ?? "Global"}
          {item.state ? ` • ${item.state}` : ""}
          {item.supplier ? ` • ${item.supplier}` : ""}
          {item.condition ? ` • ${item.condition}` : ""}
        </p>
        <p className="text-sm text-[#F2E6C8]/85 mb-2">
          {vendorRating?.rating
            ? `${starText(vendorRating.rating)} ${vendorRating.rating.toFixed(1)} (${vendorRating.reviewCount ?? 0} reviews${vendorRating.reviewSource ? ` • ${vendorRating.reviewSource}` : ""})`
            : "No business rating yet"}
        </p>
        <p className="text-2xl mb-2">
          {item.price != null ? `${item.currency ?? "USD"} ${item.price}` : "Price on supplier site"}
          {item.unit ? ` / ${item.unit}` : ""}
        </p>
        <p className="text-sm text-[#F2E6C8]/80 mb-1">
          {item.stockStatus ?? item.availabilityStatus ?? "Availability unknown"}
          {item.leadTime ? ` • ${item.leadTime}` : ""}
          {item.minOrderQty ? ` • MOQ ${item.minOrderQty}` : ""}
        </p>
        <p className="text-base leading-relaxed mt-4">{item.description ?? "Detailed product profile coming soon."}</p>

        {item.specifications && item.specifications.length > 0 ? (
          <div className="mt-6 text-left">
            <h2 className="text-xl font-semibold">Specifications</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.specifications.map((spec) => (
                <div key={`${spec.label}-${spec.value}`} className="rounded border border-[#F2E6C8]/20 bg-[#F2E6C8]/5 p-3">
                  <div className="text-xs text-[#F2E6C8]/70">{spec.label}</div>
                  <div className="text-sm mt-1">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div>
            <h3 className="font-semibold">Applications</h3>
            <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
              {(item.applications ?? []).length > 0 ? item.applications?.map((entry) => <li key={entry}>{entry}</li>) : <li>—</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Compatible With</h3>
            <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
              {(item.compatibleWith ?? []).length > 0 ? item.compatibleWith?.map((entry) => <li key={entry}>{entry}</li>) : <li>—</li>}
            </ul>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div>
            <h3 className="font-semibold">Certifications</h3>
            <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
              {(item.certifications ?? []).length > 0 ? item.certifications?.map((entry) => <li key={entry}>{entry}</li>) : <li>—</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Safety Notes</h3>
            <ul className="mt-2 space-y-1 text-sm list-disc pl-5">
              {(item.safetyNotes ?? []).length > 0 ? item.safetyNotes?.map((entry) => <li key={entry}>{entry}</li>) : <li>—</li>}
            </ul>
          </div>
        </div>

        {item.packageOptions && item.packageOptions.length > 0 ? (
          <div className="mt-6 text-left">
            <h3 className="font-semibold">Packaging Options</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.packageOptions.map((pkg) => (
                <span key={pkg} className="text-xs bg-[#F2E3C7]/10 text-[#F2E3C7] px-2 py-1 rounded">
                  {pkg}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 text-left">
          <h3 className="font-semibold">Procurement & Logistics</h3>
          <p className="mt-2 text-sm">{item.procurementNotes ?? "Contact supplier for current purchasing terms."}</p>
          <p className="mt-2 text-sm">{item.shippingNotes ?? "Shipping details are provided by supplier at checkout."}</p>
          <p className="mt-2 text-sm">{item.supportNotes ?? "Supplier support details available on listing page."}</p>
        </div>

        <p className="text-lg leading-relaxed">
          Availability is continuously curated. If this listing goes out of stock or is removed by the supplier, it is automatically archived from the public market.
        </p>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-6 bg-[#A44E32] text-[#F2E3C7] px-6 py-2 rounded-md hover:bg-[#4A2F1C] hover:text-[#F2E3C7] transition-all"
        >
          Open Supplier Listing
        </a>
        <Link
          href="/market"
          className="inline-block mt-8 bg-[#A44E32] text-[#F2E3C7] px-6 py-2 rounded-md hover:bg-[#4A2F1C] hover:text-[#F2E3C7] transition-all"
        >
          Back to Market
        </Link>
      </div>
    </main>
  );
}
