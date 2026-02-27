import glazesData from "./database/glazes.data.json";

export type RecipeIngredient = {
  name: string;
  amount: number;
  unit: "%" | "g";
};

export type GlazeVariation = {
  name: string;
  notes?: string;
  recipe: RecipeIngredient[];
};

export type Glaze = {
  id: string;
  name: string;
  description: string;
  img: string;
  finish: "Glossy" | "Satin" | "Matte" | "Semi-Matte" | "Crystalline" | "Variegated";
  color: string;
  ingredients: string[];
  recipe?: RecipeIngredient[];
  variations?: GlazeVariation[];
  firingCone: string;
  sourceLabel: string;
  sourceRef: string;
  maker?: string;
  available?: boolean;
};

export const glazes: Glaze[] = (glazesData as Glaze[]).filter((entry) => entry.available !== false);

export default glazes;
