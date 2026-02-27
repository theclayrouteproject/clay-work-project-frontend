export type Clay = {
  id: number;
  name: string;
  brand?: string;
  body: "earthenware" | "stoneware" | "porcelain" | string;
  maturation?: string; // e.g., "Cone 5-6"
  color?: string;
  grog?: string;
  plasticity?: string;
  description?: string;
  composition?: string;
  dryingBehavior?: string;
  shrinkageRate?: string;
  absorptionRate?: string;
  firingRange?: string;
  atmosphere?: string;
  bestFor?: string[];
  cautions?: string[];
  compatibleGlazes?: string[];
  reclaimNotes?: string;
  wedgingNotes?: string;
  trimmingWindow?: string;
  throwingNotes?: string;
  handbuildingNotes?: string;
  img?: string;
};

export const clays: Clay[] = [
  {
    id: 1,
    name: "EPK Ball Clay",
    brand: "Common",
    body: "stoneware",
    maturation: "Cone 5-10 (varies by recipe)",
    color: "warm off-white",
    plasticity: "high",
    description:
      "A highly plastic secondary clay used to increase workability, green strength, and dry handling in stoneware and porcelain blends. It performs especially well in throwing bodies and slip systems where bend strength is important.",
    composition: "Fine particle ball clay with moderate iron and organic content.",
    dryingBehavior: "Moderate drying speed with some warping risk in thin unsupported areas.",
    shrinkageRate: "Medium to high when used at larger percentages.",
    absorptionRate: "Depends on host body; commonly low when blended into mature stoneware.",
    firingRange: "Cone 5–10 depending on body formulation.",
    atmosphere: "Works in oxidation and reduction.",
    bestFor: ["Plasticity boost", "Throwing blends", "Slip casting blends", "Green-strength tuning"],
    cautions: ["Can increase drying shrinkage", "Overuse may raise warping/cracking risk"],
    compatibleGlazes: ["Celadon", "Tenmoku", "Satin white", "Clear liner"],
    reclaimNotes: "Reclaims well; screen slurry to remove agglomerates before drying to stiffness.",
    wedgingNotes: "Spiral wedge thoroughly to align platelets and reduce lamination.",
    trimmingWindow: "Trim at medium leather-hard to avoid tearing on sharp tools.",
    throwingNotes: "Center easily; maintain rib compression to reduce S-cracks in heavier forms.",
    handbuildingNotes: "Use compression passes at seams and slab edges to reduce cracking.",
    img: "/TCRP%20Logo_2.png",
  },
  {
    id: 2,
    name: "Grolleg Porcelain",
    brand: "Sibelco",
    body: "porcelain",
    maturation: "Cone 10",
    color: "white",
    plasticity: "medium-low",
    description:
      "A premium low-iron kaolin favored for bright porcelain color, translucency potential, and clean fired surfaces. Commonly blended with feldspar and silica to build high-fire porcelain bodies with crisp detail retention.",
    composition: "Primary kaolin with low titanium and iron impurities.",
    dryingBehavior: "Even drying when supported; edges can split if rushed.",
    shrinkageRate: "High relative to many stoneware bodies.",
    absorptionRate: "Very low when fully mature at target cone.",
    firingRange: "Cone 9–11 typical for porcelain maturity.",
    atmosphere: "Oxidation and reduction; color remains clean in oxidation.",
    bestFor: ["Porcelain throwing", "Translucent ware", "Slip casting", "Fine detail forms"],
    cautions: ["Lower plasticity may challenge beginners", "Requires careful drying and compression"],
    compatibleGlazes: ["Clear liner", "Celadon", "Glossy transparent", "Oribe-style greens"],
    reclaimNotes: "Allow full slaking before remixing; de-air thoroughly for wheel use.",
    wedgingNotes: "Extended wedging helps uniform moisture and prevents micro-lamination.",
    trimmingWindow: "Trim early leather-hard to avoid chattering and shelling.",
    throwingNotes: "Use less water, frequent compression, and controlled pull speed.",
    handbuildingNotes: "Support vertical forms during drying; use slower covered drying cycles.",
    img: "/TCRP%20Logo_2.png",
  },
  {
    id: 3,
    name: "OM4 Ball Clay",
    brand: "Old Hickory",
    body: "stoneware",
    maturation: "Cone 6-10",
    color: "cream",
    plasticity: "very high",
    description:
      "A widely used high-plasticity ball clay that improves body cohesion and wheel response. Frequently included in studio recipes for stronger greenware and smoother trimming behavior.",
    composition: "Plastic secondary clay with moderate fluxing contaminants.",
    dryingBehavior: "Controlled drying needed on thicker work; can hold detail well.",
    shrinkageRate: "Medium-high in high-percentage recipes.",
    absorptionRate: "Body-dependent; typically low once mature.",
    firingRange: "Cone 6–10 in mixed bodies.",
    atmosphere: "Stable in oxidation and reduction.",
    bestFor: ["Wheel-thrown forms", "General stoneware blends", "Strengthening lean bodies"],
    cautions: ["Can reduce thermal shock tolerance if overused", "May darken fired color slightly"],
    compatibleGlazes: ["Tenmoku", "Floating blue", "Rutile blends", "Matte whites"],
    reclaimNotes: "Blend reclaimed material with fresh body for consistent plasticity.",
    wedgingNotes: "Use firm ram’s-head wedging when body is very soft.",
    trimmingWindow: "Best at medium leather-hard for clean trimming ribbons.",
    throwingNotes: "Forgiving on larger pulls; compress floors and rims deliberately.",
    handbuildingNotes: "Works well for coils/slabs with proper seam scoring and compression.",
    img: "/TCRP%20Logo_2.png",
  },
  {
    id: 4,
    name: "Hydrite Earthenware",
    brand: "Standard",
    body: "earthenware",
    maturation: "Cone 06-04",
    color: "red/terracotta (varies)",
    plasticity: "medium",
    description:
      "A traditional low-fire earthenware family suitable for decorative, sculptural, and functional work with proper glaze fit. Its warm fired color and approachable firing range make it ideal for high-volume studio workflows.",
    composition: "Iron-bearing earthenware with naturally fluxing clays and fillers.",
    dryingBehavior: "Generally forgiving; uneven thickness can still crack at seams.",
    shrinkageRate: "Low to medium.",
    absorptionRate: "Moderate to high unless fully sealed by glaze.",
    firingRange: "Cone 06–04 typical.",
    atmosphere: "Primarily oxidation; color shifts in reduction are possible.",
    bestFor: ["Low-fire functional ware", "Decorative tile", "Sculpture", "Classroom production"],
    cautions: ["Porous if unglazed", "Avoid high-fire cycles that can bloat or deform"],
    compatibleGlazes: ["Low-fire gloss", "Majolica bases", "Underglaze + clear coat"],
    reclaimNotes: "Very reclaim-friendly; keep reclaim batches separated by body color.",
    wedgingNotes: "Minimal wedging needed if moisture is uniform.",
    trimmingWindow: "Wide trimming window from soft to medium leather-hard.",
    throwingNotes: "Keep wall thickness even to reduce drying stress.",
    handbuildingNotes: "Excellent for slab and coil construction with minimal spring-back.",
    img: "/TCRP%20Logo_2.png",
  },
  {
    id: 5,
    name: "B-Mix Plastic Stoneware",
    brand: "Laguna",
    body: "stoneware",
    maturation: "Cone 5-6",
    color: "buff",
    plasticity: "high",
    description:
      "A popular mid-fire stoneware body engineered for smooth throwing, balanced workability, and reliable glaze fit at cone 5–6. Suitable for both functional tableware and larger wheel-thrown forms.",
    composition: "Refined stoneware blend with plastic clays, silica, and feldspathic fluxes.",
    dryingBehavior: "Moderate drying with good shape retention when compressed.",
    shrinkageRate: "Medium.",
    absorptionRate: "Low at maturity (cone 5–6).",
    firingRange: "Cone 5–6, occasional cone 7 depending on schedule.",
    atmosphere: "Best in oxidation; can be used in reduction with glaze testing.",
    bestFor: ["Functional tableware", "Wheel throwing", "Lidded forms", "Daily-use ware"],
    cautions: ["Overfiring can increase movement", "Test glaze fit for microwave/dishwasher durability"],
    compatibleGlazes: ["Clear liner", "Satin white", "Rutile blue", "Floating blue"],
    reclaimNotes: "Reclaims smoothly; de-air before production throwing.",
    wedgingNotes: "Short wedging cycle usually sufficient for fresh bagged clay.",
    trimmingWindow: "Trim at firm leather-hard to keep edges crisp.",
    throwingNotes: "Performs well on medium-large cylinders and bowls.",
    handbuildingNotes: "Low memory makes slab work manageable with light compression.",
    img: "/TCRP%20Logo_2.png",
  },
];

export default clays;
