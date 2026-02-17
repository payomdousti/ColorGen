import type chroma from "chroma-js";
import { getCatalogWeight } from "./itemCatalog";

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
  weight: number;
  tendency: Tendency;
}

export interface RoomTemplate {
  name: string;
  items: Omit<RoomItem, "id">[];
}

function templateItem(
  name: string,
  tendency: Tendency = "any"
): Omit<RoomItem, "id"> {
  return {
    name,
    color: null,
    weight: getCatalogWeight(name),
    tendency,
  };
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    name: "Living Room",
    items: [
      templateItem("Floors"),
      templateItem("Main Wall", "lighter"),
      templateItem("Accent Wall"),
      templateItem("Built-in Bookshelf"),
      templateItem("Doors", "neutral"),
      templateItem("Drapes"),
      templateItem("Couch"),
      templateItem("Rug"),
    ],
  },
  {
    name: "Bedroom",
    items: [
      templateItem("Floors"),
      templateItem("Main Wall", "lighter"),
      templateItem("Accent Wall"),
      templateItem("Doors", "neutral"),
      templateItem("Built-in Bookshelf"),
      templateItem("Duvet Cover"),
      templateItem("Sheets", "lighter"),
      templateItem("Fitted Sheet", "lighter"),
      templateItem("Pillowcases"),
      templateItem("Upholstery"),
      templateItem("Rug"),
    ],
  },
];
