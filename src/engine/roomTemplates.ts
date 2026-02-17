import type chroma from "chroma-js";

export type ItemWeight = "large" | "medium" | "small";

export const WEIGHT_LABELS: Record<ItemWeight, string> = {
  large: "L",
  medium: "M",
  small: "S",
};

export type Tendency =
  | "any"
  | "lighter"
  | "darker"
  | "warmer"
  | "cooler"
  | "neutral"
  | "bold";

export const TENDENCY_LABELS: Record<Tendency, string> = {
  any: "Any",
  lighter: "Lighter",
  darker: "Darker",
  warmer: "Warmer",
  cooler: "Cooler",
  neutral: "Neutral",
  bold: "Bold",
};

export interface RoomItem {
  id: number;
  name: string;
  color: chroma.Color | null;
  weight: ItemWeight;
  tendency: Tendency;
}

export interface RoomTemplate {
  name: string;
  items: Omit<RoomItem, "id">[];
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    name: "Living Room",
    items: [
      { name: "Floors", color: null, weight: "large", tendency: "any" },
      { name: "Main Wall", color: null, weight: "large", tendency: "lighter" },
      { name: "Accent Wall", color: null, weight: "medium", tendency: "any" },
      { name: "Built-in Bookshelf", color: null, weight: "medium", tendency: "any" },
      { name: "Doors", color: null, weight: "medium", tendency: "neutral" },
      { name: "Drapes", color: null, weight: "medium", tendency: "any" },
      { name: "Couch", color: null, weight: "medium", tendency: "any" },
      { name: "Rug", color: null, weight: "medium", tendency: "any" },
    ],
  },
  {
    name: "Bedroom",
    items: [
      { name: "Floors", color: null, weight: "large", tendency: "any" },
      { name: "Main Wall", color: null, weight: "large", tendency: "lighter" },
      { name: "Accent Wall", color: null, weight: "medium", tendency: "any" },
      { name: "Doors", color: null, weight: "medium", tendency: "neutral" },
      { name: "Built-in Bookcase", color: null, weight: "medium", tendency: "any" },
      { name: "Duvet Cover", color: null, weight: "large", tendency: "any" },
      { name: "Sheets", color: null, weight: "large", tendency: "lighter" },
      { name: "Fitted Sheet", color: null, weight: "large", tendency: "lighter" },
      { name: "Pillowcases", color: null, weight: "small", tendency: "any" },
      { name: "Reading Nook Upholstery", color: null, weight: "small", tendency: "any" },
      { name: "Rug", color: null, weight: "medium", tendency: "any" },
    ],
  },
];
